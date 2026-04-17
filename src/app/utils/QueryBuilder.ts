import { Query, Types } from 'mongoose';
import { excludeField } from '../constants';

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const queryObj: any = { ...this.query };

    // Remove excluded fields
    for (const field of excludeField) {
      delete queryObj[field];
    }

    // Apply remaining filters
    this.modelQuery = this.modelQuery.find(queryObj);

    return this;
  }

  search(searchableField: string[]): this {
    const searchTerm = this.query.searchTerm || '';
    
    if (searchTerm) {
      const searchQuery = {
        $or: searchableField.map(field => ({
          [field]: { $regex: searchTerm, $options: 'i' },
        })),
      };
      this.modelQuery = this.modelQuery.find(searchQuery);
    }
    
    return this;
  }

  sort(): this {
    const sort = this.query.sort || '-createdAt';

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }
  fields(): this {
    const fields = this.query.fields?.split(',').join(' ') || '';

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }

  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  build() {
    return this.modelQuery;
  }

  async getMeta() {
    // find() এ যে filter/search apply হয়েছে সেটা নিলাম
    const filter = this.modelQuery.getFilter();

    // শুধু filter/search এর উপর ভিত্তি করে count করব
    const totalDocuments = await this.modelQuery.model.countDocuments(filter);

    // pagination info
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    const totalPage = Math.ceil(totalDocuments / limit);

    return { page, limit, total: totalDocuments, totalPage };
  }
}
