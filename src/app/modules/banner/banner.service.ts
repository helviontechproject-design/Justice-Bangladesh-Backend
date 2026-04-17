import { JwtPayload } from "jsonwebtoken"
import { IBanner } from "./banner.interface"
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ERole } from "../user/user.interface";
import { Banner } from "./banner.model";
import { QueryBuilder } from "../../utils/QueryBuilder";







const createBanner = async (payload: Partial<IBanner>, decodedUser: JwtPayload) => {
 
  if (decodedUser.role !== ERole.SUPER_ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, "Only admin can create banners!");
  }

  const result = await Banner.create(payload);
  return result;
};



const updateBanner = async (id: string, payload: Partial<IBanner>, decodedUser: JwtPayload) => {

  const banner = await Banner.findById(id);
  if (!banner) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Banner not found!');
  }

  if (decodedUser.role !== ERole.SUPER_ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only admin can update banners!');
  }

  const result = await Banner.findByIdAndUpdate(id, payload, { new: true });

  return result;
};


const getAllBanners = async (query: Record<string, string>) => {
  const filter: Record<string, any> = { isActive: true };
  if (query.target && query.target !== 'all') {
    filter.$or = [
      { target: query.target },
      { target: 'all' },
      { target: { $exists: false } }, // old banners without target field
    ];
  }

  const banners = Banner.find(filter);
  const queryBuilder = new QueryBuilder(banners, query);
  const allBanners = queryBuilder.paginate();
  const [data, meta] = await Promise.all([
    allBanners.build().exec(),
    queryBuilder.getMeta(),
  ]);
  return { data, meta };
}



const deleteBanner = async (id: string, decodedUser: JwtPayload) => {
  if (decodedUser.role !== ERole.SUPER_ADMIN) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only admin can delete banners!');
  }
  const banner = await Banner.findById(id);

  if (!banner) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  const result = await Banner.findByIdAndDelete(id);
  return result;
};


export const bannerService = {
  createBanner,
  updateBanner,
  getAllBanners,
  deleteBanner,
};