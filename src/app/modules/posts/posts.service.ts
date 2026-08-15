import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { NotificationService } from '../notifications/notifications.service';

const createPost = async (userId: string, payload: any) => {
  // Ensure content is always a string (image-only posts may have empty content)
  const data = {
    userId,
    content: payload.content || '',
    images: payload.images || [],
    location: payload.location || undefined,
  };

  const post = await prisma.post.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        },
      },
    },
  });

  return post;
};

const getAllPosts = async (options: any) => {
  const { page = 1, limit = 10, skip = 0, sortBy, sortOrder } = options;

  const result = await prisma.post.findMany({
    skip,
    take: limit,
    orderBy: sortBy && sortOrder ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        }
      },
      reactions: true,
    },
  });

  const total = await prisma.post.count();
  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      total,
      page,
      limit,
      totalPage,
    },
    data: result,
  };
};

const getPostById = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        },
      },
      comments: {
        where: { OR: [{ parentId: null }, { parentId: { isSet: false } }] },
        // Intentionally leaving out nested comments in getPostById to speed up post fetching.
        // We will fetch comments independently via getPostComments.
      },
      reactions: true,
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  return post;
};

const updatePost = async (id: string, userId: string, payload: any) => {
  const isExist = await prisma.post.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  if (isExist.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this post');
  }

  const result = await prisma.post.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deletePost = async (id: string, userId: string, role: string) => {
  const isExist = await prisma.post.findUnique({
    where: { id },
  });

  if (!isExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
  }

  if (isExist.userId !== userId && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this post');
  }

  const result = await prisma.post.delete({
    where: { id },
  });

  return result;
};

const addComment = async (postId: string, userId: string, content: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');

  const comment = await prisma.comment.create({
    data: {
      postId,
      userId,
      content,
    },
    include: {
      user: {
        select: { id: true, displayName: true, username: true, avatar: true }
      }
    }
  });

  // Fire notification to post owner (skip if commenter is post owner)
  if (post.userId !== userId) {
    const commenterUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true, avatar: true },
    });
    await NotificationService.createNotification({
      userId: post.userId,
      title: 'New Comment',
      body: `${commenterUser?.displayName || 'Someone'} commented on your post`,
      type: 'comment',
      refId: postId,
      refType: 'post',
      actorId: userId,
      actorName: commenterUser?.displayName,
      actorAvatar: commenterUser?.avatar,
    }).catch(err => console.error('Notification error:', err));
  }

  return comment;
};

const removeComment = async (commentId: string, userId: string, role: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');

  if (comment.userId !== userId && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this comment');
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return { success: true };
};

const toggleReaction = async (postId: string, userId: string, type: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');

  const existingReaction = await prisma.reaction.findFirst({
    where: {
      postId,
      userId,
    },
  });

  if (existingReaction) {
    if (existingReaction.type === type) {
      // Remove reaction if clicking the same type
      await prisma.reaction.delete({ where: { id: existingReaction.id } });
      return { status: 'removed' };
    } else {
      // Update reaction to new type
      const updated = await prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { type: type as any },
      });
      return { status: 'updated', reaction: updated };
    }
  } else {
    // Add new reaction
    const reaction = await prisma.reaction.create({
      data: { postId, userId, type: type as any },
    });

    // Fire notification to post owner (skip self-reaction)
    if (post.userId !== userId) {
      const reactorUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, avatar: true },
      });
      await NotificationService.createNotification({
        userId: post.userId,
        title: 'New Reaction',
        body: `${reactorUser?.displayName || 'Someone'} reacted to your post`,
        type: 'reaction',
        refId: postId,
        refType: 'post',
        actorId: userId,
        actorName: reactorUser?.displayName,
        actorAvatar: reactorUser?.avatar,
      }).catch(err => console.error('Notification error:', err));
    }

    return { status: 'added', reaction };
  }
};

const updateComment = async (commentId: string, userId: string, content: string, role: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');

  if (comment.userId !== userId && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this comment');
  }

  const result = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        }
      }
    }
  });

  return result;
};

const replyToComment = async (commentId: string, userId: string, content: string) => {
  const parentComment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!parentComment) throw new ApiError(httpStatus.NOT_FOUND, 'Parent comment not found');

  const reply = await prisma.comment.create({
    data: {
      content,
      postId: parentComment.postId,
      reviewId: parentComment.reviewId,
      userId,
      parentId: commentId,
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        }
      }
    }
  });

  return reply;
};

const toggleCommentReaction = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');

  let updatedLikedBy = [...(comment.likedBy || [])];

  if (updatedLikedBy.includes(userId)) {
    updatedLikedBy = updatedLikedBy.filter(id => id !== userId);
  } else {
    updatedLikedBy.push(userId);
  }

  const result = await prisma.comment.update({
    where: { id: commentId },
    data: { likedBy: updatedLikedBy },
  });

  return result;
};

const getPostComments = async (postId: string) => {
  const comments = await prisma.comment.findMany({
    where: {
      postId,
      OR: [{ parentId: null }, { parentId: { isSet: false } }]
    },
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
        }
      },
      replies: {
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true,
              avatar: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return comments;
};

export const PostService = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  addComment,
  removeComment,
  toggleReaction,
  updateComment,
  replyToComment,
  toggleCommentReaction,
  getPostComments,
};
