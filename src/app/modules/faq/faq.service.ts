import { Faq } from './faq.model';
import { IFaq, TFaqRole } from './faq.interface';

const getAll = async (role?: TFaqRole) => {
  const filter: Record<string, unknown> = { isActive: true };
  if (role) filter.role = role;
  return Faq.find(filter).sort({ order: 1, createdAt: 1 });
};

const getAllAdmin = async (role?: TFaqRole) => {
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  return Faq.find(filter).sort({ order: 1, createdAt: 1 });
};

const create = async (payload: IFaq) => Faq.create(payload);

const update = async (id: string, payload: Partial<IFaq>) =>
  Faq.findByIdAndUpdate(id, payload, { new: true });

const remove = async (id: string) => Faq.findByIdAndDelete(id);

export const faqService = { getAll, getAllAdmin, create, update, remove };
