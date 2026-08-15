import express from 'express';
import { UploadController } from './upload.controller';
import { uploadCloudinary } from '../../../lib/cloudinary';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../../../enums/user';

const router = express.Router();

router.post(
  '/',
  auth(USER_ROLE.USER, USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN),
  uploadCloudinary.single('file'),
  UploadController.uploadFile
);

export const UploadRoutes = router;
