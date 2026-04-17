import { ServiceModel } from '../modules/service/service.model';

const services = [
  { name: 'Separation', price: 199, isFeatured: true },
  { name: 'Divorce', price: 299, isFeatured: true },
  { name: 'Criminal', price: 399, isFeatured: false },
  { name: 'Property', price: 249, isFeatured: true },
  { name: 'Family', price: 199, isFeatured: false },
  { name: 'Business', price: 349, isFeatured: true },
  { name: 'Civil', price: 219, isFeatured: false },
  { name: 'Tax Law', price: 279, isFeatured: false },
];

export const seedServices = async () => {
  try {
    const existing = await ServiceModel.countDocuments();
    if (existing > 0) {
      console.log('Services already seeded!');
      return;
    }

    await ServiceModel.insertMany(
      services.map(s => ({
        name: s.name,
        price: s.price,
        isFeatured: s.isFeatured,
        isActive: true,
      }))
    );

    console.log('✅ Services seeded successfully!');
  } catch (error) {
    console.log('Error seeding services:', error);
  }
};
