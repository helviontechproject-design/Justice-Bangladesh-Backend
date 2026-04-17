import { Policy } from './policy.model';
import { TPolicyRole, TPolicyType } from './policy.interface';

const get = async (type: TPolicyType, role: TPolicyRole) => {
  let doc = await Policy.findOne({ type, role });
  if (!doc) doc = await Policy.create({ type, role, content: '' });
  return doc;
};

const getAll = async (role?: TPolicyRole) => {
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  return Policy.find(filter);
};

const upsert = async (type: TPolicyType, role: TPolicyRole, content: string) =>
  Policy.findOneAndUpdate({ type, role }, { content }, { upsert: true, new: true });

export const policyService = { get, getAll, upsert };
