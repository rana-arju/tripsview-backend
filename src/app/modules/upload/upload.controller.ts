import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import ApiError from '../../errors/ApiError';

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please upload a file');
  }

  // When using multer-storage-cloudinary, the file object will have a path property containing the Cloudinary URL
  const fileUrl = req.file.path;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'File uploaded successfully',
    data: {
      url: fileUrl,
    },
  });
});

export const UploadController = {
  uploadFile,
};
