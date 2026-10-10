import 'server-only';
import {
  hotelInputSchema,
  hotelUpdateSchema,
  restaurantInputSchema,
  restaurantUpdateSchema,
  serviceInputSchema,
  serviceUpdateSchema,
  type HotelInput,
  type RestaurantInput,
  type ServiceInput,
} from '../schemas';
import { createCatalogHandlers } from './handlers';
import { createCatalogRepository } from './repository';

export const hotelRepository = createCatalogRepository<HotelInput>('hotels', 'khach-san');
export const restaurantRepository = createCatalogRepository<RestaurantInput>(
  'restaurants',
  'nha-hang',
);
export const serviceRepository = createCatalogRepository<ServiceInput>('services', 'dich-vu');

export const hotelHandlers = createCatalogHandlers({
  repository: hotelRepository,
  inputSchema: hotelInputSchema,
  updateSchema: hotelUpdateSchema,
});

export const restaurantHandlers = createCatalogHandlers({
  repository: restaurantRepository,
  inputSchema: restaurantInputSchema,
  updateSchema: restaurantUpdateSchema,
});

export const serviceHandlers = createCatalogHandlers({
  repository: serviceRepository,
  inputSchema: serviceInputSchema,
  updateSchema: serviceUpdateSchema,
});
