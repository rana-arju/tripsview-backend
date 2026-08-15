import express from 'express';
import { AuthRouters } from '../modules/auth/auth.routes';
import { UserRouters } from '../modules/users/users.routes';
import { ListingRouters } from '../modules/listings/listings.routes';
import { TripRouters } from '../modules/trips/trips.routes';
import { ReviewRouters } from '../modules/reviews/reviews.routes';
import { SavedItemRouters } from '../modules/savedItems/savedItems.routes';
import { NotificationRouters } from '../modules/notifications/notifications.routes';
import { UploadRoutes } from '../modules/upload/upload.routes';
import { PostRouters } from '../modules/posts/posts.routes';


const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/users',
    route: UserRouters,
  },
  {
    path: '/listings',
    route: ListingRouters,
  },
  {
    path: '/trips',
    route: TripRouters,
  },
  {
    path: '/reviews',
    route: ReviewRouters,
  },
  {
    path: '/saved-items',
    route: SavedItemRouters,
  },
  {
    path: '/notifications',
    route: NotificationRouters,
  },
  {
    path: '/upload',
    route: UploadRoutes,
  },
  {
    path: '/posts',
    route: PostRouters,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
