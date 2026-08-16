import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
      phone: true,
      avatar: true,
      coverPhoto: true,
      bio: true,
      location: true,
      interests: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
        }
      },
      trips: {
        select: {
          id: true,
          name: true,
          destinations: true,
          startDate: true,
          endDate: true,
        }
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
        },
      }
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const updateMyProfile = async (userId: string, payload: any) => {
  const isExistUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isExistUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (payload.username) {
    const isUsernameTaken = await prisma.user.findUnique({
      where: {
        username: payload.username,
      },
    });

    if (isUsernameTaken && isUsernameTaken.id !== userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Username is already taken');
    }
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: payload,
    select: {
      id: true,
      email: true,
      displayName: true,
      username: true,
      phone: true,
      avatar: true,
      coverPhoto: true,
      bio: true,
      location: true,
      interests: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const getUserProfileByUsername = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      avatar: true,
      coverPhoto: true,
      bio: true,
      location: true,
      interests: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
        }
      },
      trips: {
        select: {
          id: true,
          name: true,
          destinations: true,
          startDate: true,
          endDate: true,
        }
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          content: true,
          createdAt: true,
        },
      }
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return user;
};

const followUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot follow yourself');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
  });

  if (!targetUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Update both the follower's following list and the target's followers list
  await prisma.user.update({
    where: { id: followerId },
    data: {
      followingIds: {
        push: followingId
      }
    }
  });

  await prisma.user.update({
    where: { id: followingId },
    data: {
      followedByIds: {
        push: followerId
      }
    }
  });

  return { success: true };
};

const unfollowUser = async (followerId: string, followingId: string) => {
  if (followerId === followingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot unfollow yourself');
  }

  const follower = await prisma.user.findUnique({
    where: { id: followerId }
  });

  const target = await prisma.user.findUnique({
    where: { id: followingId }
  });

  if (!follower || !target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  await prisma.user.update({
    where: { id: followerId },
    data: {
      followingIds: follower.followingIds.filter(id => id !== followingId)
    }
  });

  await prisma.user.update({
    where: { id: followingId },
    data: {
      followedByIds: target.followedByIds.filter(id => id !== followerId)
    }
  });

  return { success: true };
};

const getUserFeed = async (username: string, page: number, limit: number, type?: string, sort?: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const fetchLimit = page * limit;
  const isPopular = sort === 'popular';
  
  // If popular, we fetch more to ensure we can sort globally (for simplicity, fetching up to 100 or fetchLimit)
  const queryLimit = isPopular ? Math.max(fetchLimit, 50) : fetchLimit;
  
  const orderDirection = sort === 'oldest' ? 'asc' : 'desc';

  let posts: any[] = [];
  let reviews: any[] = [];

  if (!type || type === 'all' || type === 'posts') {
    posts = await prisma.post.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: orderDirection },
      take: queryLimit,
      include: {
        user: { select: { displayName: true, username: true, avatar: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: true
      }
    });
  }

  if (!type || type === 'all' || type === 'reviews') {
    reviews = await prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: orderDirection },
      take: queryLimit,
      include: {
        user: { select: { displayName: true, username: true, avatar: true } },
        listing: { select: { title: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: true,
      }
    });
  }

  const formattedPosts = posts.map(post => ({
    id: post.id,
    type: 'post',
    author: post.user?.displayName || post.user?.username,
    user: post.user,
    avatar: post.user?.avatar,
    createdAt: post.createdAt,
    content: post.content,
    image: post.images && post.images.length > 0 ? post.images[0] : null,
    images: post.images,
    likes: post._count.reactions,
    comments: post._count.comments,
    reactions: post.reactions,
    location: post.location,
    popularityScore: post._count.reactions + post._count.comments * 2, // Arbitrary weight
  }));

  const formattedReviews = reviews.map((review: any) => ({
    id: review.id,
    type: 'review',
    author: review.user?.displayName || review.user?.username,
    user: review.user,
    avatar: review.user?.avatar,
    createdAt: review.createdAt,
    content: review.content,
    image: review.images && review.images.length > 0 ? review.images[0] : null,
    images: review.images,
    action: `reviewed ${review.listing?.title || 'a place'}`,
    rating: review.rating,
    likes: review._count?.reactions ?? 0,
    comments: review._count?.comments ?? 0,
    reactions: review.reactions || [],
    popularityScore: (review._count?.reactions ?? 0) + (review._count?.comments ?? 0) * 2,
  }));

  let combined = [...formattedPosts, ...formattedReviews];

  if (isPopular) {
    combined.sort((a, b) => b.popularityScore - a.popularityScore);
  } else if (sort === 'oldest') {
    combined.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } else {
    combined.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const startIndex = (page - 1) * limit;
  const slicedData = combined.slice(startIndex, startIndex + limit);

  return {
    meta: {
      page,
      limit,
      total: combined.length,
      totalPage: Math.ceil(combined.length / limit),
      hasMore: startIndex + limit < combined.length || (posts.length === queryLimit || reviews.length === queryLimit)
    },
    data: slicedData,
  };
};

const getUserFollowers = async (username: string, currentUserId?: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      followers: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
          bio: true,
          location: true,
          followedByIds: true,
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const result = user.followers.map(f => {
    const isFollowing = currentUserId ? f.followedByIds.includes(currentUserId) : false;
    return {
      id: f.id,
      displayName: f.displayName,
      username: f.username,
      avatar: f.avatar,
      bio: f.bio,
      location: f.location,
      isFollowing,
    };
  });

  return result;
};

const getUserFollowing = async (username: string, currentUserId?: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      following: {
        select: {
          id: true,
          displayName: true,
          username: true,
          avatar: true,
          bio: true,
          location: true,
          followedByIds: true,
        }
      }
    }
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const result = user.following.map(f => {
    const isFollowing = currentUserId ? f.followedByIds.includes(currentUserId) : false;
    return {
      id: f.id,
      displayName: f.displayName,
      username: f.username,
      avatar: f.avatar,
      bio: f.bio,
      location: f.location,
      isFollowing,
    };
  });

  return result;
};

export const UserService = {
  getMyProfile,
  updateMyProfile,
  getUserProfileByUsername,
  followUser,
  unfollowUser,
  getUserFeed,
  getUserFollowers,
  getUserFollowing,
};
