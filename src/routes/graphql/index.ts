import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  graphql,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  Source,
  validate,
  parse,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInputObjectType,
} from 'graphql';
import { PrismaClient } from '@prisma/client';
import depthLimit from 'graphql-depth-limit';
import { UUIDType } from './types/uuid.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const MemberTypeId = new GraphQLEnumType({
    name: 'MemberTypeId',
    values: {
      basic: {
        value: 'basic',
        description: '',
      },
      business: {
        value: 'business',
        description: '',
      },
    },
  });

  const member = new GraphQLObjectType({
    name: 'member',
    fields: () => ({
      id: {
        type: MemberTypeId,
        description: '',
      },
      discount: {
        type: GraphQLFloat,
        description: '',
      },
      postsLimitPerMonth: {
        type: GraphQLInt,
        description: '',
      },
    }),
  });

  const post = new GraphQLObjectType({
    name: 'post',
    fields: () => ({
      id: {
        type: UUIDType,
        description: '',
      },
      title: {
        type: GraphQLString,
        description: '',
      },
      content: {
        type: GraphQLString,
        description: '',
      },
      authorId: {
        type: UUIDType,
        description: '',
      },
    }),
  });

  const profile = new GraphQLObjectType({
    name: 'profile',
    fields: () => ({
      id: {
        type: UUIDType,
        description: '',
      },
      isMale: {
        type: GraphQLBoolean,
        description: '',
      },
      yearOfBirth: {
        type: GraphQLInt,
        description: '',
      },
      userId: {
        type: UUIDType,
        description: '',
      },

      memberTypeId: {
        type: MemberTypeId,
        description: '',
      },

      memberType: {
        type: member,
        description: '',
        resolve: async ({ memberTypeId }) => {
          const id = memberTypeId as string;
          return await prisma.memberType.findUnique({
            where: {
              id,
            },
          });
        },
      },
    }),
  });

  const user: GraphQLObjectType = new GraphQLObjectType({
    name: 'user',
    fields: () => ({
      id: {
        type: UUIDType,
        description: '',
      },
      name: {
        type: GraphQLString,
        description: '',
      },
      balance: {
        type: GraphQLFloat,
        description: '',
      },
      profile: {
        type: profile,
        description: '',
        resolve: async ({ id }) => {
          const userId = id as string;
          return await prisma.profile.findUnique({
            where: {
              userId,
            },
          });
        },
      },
      posts: {
        type: new GraphQLList(new GraphQLNonNull(post)),
        description: '',
        resolve: async ({ id }) => {
          const authorId = id as string;
          return await prisma.post.findMany({
            where: {
              authorId,
            },
          });
        },
      },
      subscribedToUser: {
        type: new GraphQLList(new GraphQLNonNull(user)),
        description: '',
        resolve: async ({ id }) => {
          const authorId = id as string;
          return prisma.user.findMany({
            where: {
              userSubscribedTo: {
                some: {
                  authorId,
                },
              },
            },
          });
        },
      },
      userSubscribedTo: {
        type: new GraphQLList(new GraphQLNonNull(user)),
        description: '',
        resolve: async ({ id }) => {
          const subscriberId = id as string;
          return prisma.user.findMany({
            where: {
              subscribedToUser: {
                some: {
                  subscriberId,
                },
              },
            },
          });
        },
      },
    }),
  });

  const rootQuery = new GraphQLObjectType({
    name: 'rootQuery',
    fields: () => ({
      memberTypes: {
        type: new GraphQLList(new GraphQLNonNull(member)),
        resolve: async () => {
          return await prisma.memberType.findMany();
        },
      },
      memberType: {
        type: member,
        args: { id: { type: MemberTypeId } },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;
          const idNumber = id as string;
          return await prisma.memberType.findUnique({
            where: {
              id: idNumber,
            },
          });
        },
      },
      posts: {
        type: new GraphQLList(new GraphQLNonNull(post)),
        resolve: async () => {
          return await prisma.post.findMany();
        },
      },
      post: {
        type: post,
        args: { id: { type: UUIDType } },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;
          const idNumber = id as string;
          return await prisma.post.findUnique({
            where: {
              id: idNumber,
            },
          });
        },
      },
      profiles: {
        type: new GraphQLList(new GraphQLNonNull(profile)),
        resolve: async () => {
          return await prisma.profile.findMany();
        },
      },
      profile: {
        type: profile,
        args: { id: { type: UUIDType } },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;
          const idNumber = id as string;
          return await prisma.profile.findUnique({
            where: {
              id: idNumber,
            },
          });
        },
      },
      users: {
        type: new GraphQLList(new GraphQLNonNull(user)),
        resolve: async () => {
          return await prisma.user.findMany();
        },
      },
      user: {
        type: user,
        args: { id: { type: UUIDType } },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;
          const idNumber = id as string;
          return await prisma.user.findUnique({
            where: {
              id: idNumber,
            },
          });
        },
      },
    }),
  });

  const CreatePostInput = new GraphQLInputObjectType({
    name: 'CreatePostInput',
    fields: () => ({
      title: {
        type: GraphQLString,
        description: '',
      },
      content: {
        type: GraphQLString,
        description: '',
      },
      authorId: {
        type: UUIDType,
        description: '',
      },
    }),
  });

  const CreateProfileInput = new GraphQLInputObjectType({
    name: 'CreateProfileInput',
    fields: () => ({
      isMale: {
        type: GraphQLBoolean,
        description: '',
      },
      yearOfBirth: {
        type: GraphQLInt,
        description: '',
      },
      userId: {
        type: UUIDType,
        description: '',
      },

      memberTypeId: {
        type: MemberTypeId,
        description: '',
      },
    }),
  });

  const CreateUserInput = new GraphQLInputObjectType({
    name: 'CreateUserInput',
    fields: () => ({
      name: {
        type: GraphQLString,
        description: '',
      },
      balance: {
        type: GraphQLFloat,
        description: '',
      },
    }),
  });

  const ChangePostInput = new GraphQLInputObjectType({
    name: 'ChangePostInput',
    fields: () => ({
      title: {
        type: GraphQLString,
        description: '',
      },
      content: {
        type: GraphQLString,
        description: '',
      }
    }),
  });

  const ChangeProfileInput = new GraphQLInputObjectType({
    name: 'ChangeProfileInput',
    fields: () => ({
      isMale: {
        type: GraphQLBoolean,
        description: '',
      },
      yearOfBirth: {
        type: GraphQLInt,
        description: '',
      },
      memberTypeId: {
        type: MemberTypeId,
        description: '',
      },
    }),
  });

  const ChangeUserInput = new GraphQLInputObjectType({
    name: 'ChangeUserInput',
    fields: () => ({
      name: {
        type: GraphQLString,
        description: '',
      },
      balance: {
        type: GraphQLFloat,
        description: '',
      },
    }),
  });

  const rootMutation = new GraphQLObjectType({
    name: 'rootMutation',
    fields: () => ({
      createPost: {
        type: post,
        args: { dto: { type: new GraphQLNonNull(CreatePostInput) } },
        resolve: async (_source, { dto }, context) => {
          const prisma = context as PrismaClient;

          const post = dto as {
            title: string;
            content: string;
            authorId: string;
          };

          return await prisma.post.create({
            data: post,
          });
        },
      },

      createProfile: {
        type: profile,
        args: { dto: { type: new GraphQLNonNull(CreateProfileInput) } },
        resolve: async (_source, { dto }, context) => {
          const prisma = context as PrismaClient;
          const profile = dto as {
            isMale: boolean;
            yearOfBirth: number;
            userId: string;
            memberTypeId: string;
          }
          return await prisma.profile.create({
            data: profile,
          });
        },
      },

      createUser: {
        type: user,
        args: { dto: { type: new GraphQLNonNull(CreateUserInput) } },
        resolve: async (_source, { dto }, context) => {
          const prisma = context as PrismaClient;
          const user = dto as {
            name: string;
            balance: number;
          }

          return await prisma.user.create({
            data: user,
          });
        },
      },

      changePost: {
        type: post,
        args: { id: { type: UUIDType }, dto: { type: new GraphQLNonNull(ChangePostInput) } },
        resolve: async (_source, { id, dto }, context) => {
          const prisma = context as PrismaClient;

          const postId = id as string;
          const post = dto as {
            title: string;
            content: string;
          };

          return await prisma.post.update({
            where: { id: postId },
            data: post,
          });
        },
      },

      changeProfile: {
        type: profile,
        args: { id: { type: UUIDType }, dto: { type: new GraphQLNonNull(ChangeProfileInput) } },
        resolve: async (_source, { id, dto }, context) => {
          const prisma = context as PrismaClient;
          const profileId = id as string;
          const profile = dto as {
            isMale: boolean;
            yearOfBirth: number;
            memberTypeId: string;
          }
          return await prisma.profile.update({
            where: { id: profileId },
            data: profile,
          });
        },
      },

      changeUser: {
        type: user,
        args: { id: { type: UUIDType }, dto: { type: new GraphQLNonNull(ChangeUserInput) } },
        resolve: async (_source, { dto, id }, context) => {
          const prisma = context as PrismaClient;
          const user = dto as {
            name: string;
            balance: number;
          }

          return await prisma.user.update({
            where: { id: id as string },
            data: user,
          });
        },
      },

      deletePost: {
        type: UUIDType,
        args: { id: { type: UUIDType } },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;

          await prisma.post.delete({
            where: {
              id: id as string,
            },
          });
        },
      },

      deleteProfile: {
        type: UUIDType,
        args: { id: { type: UUIDType } },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;
          await prisma.profile.delete({
            where: {
              id: id as string,
            },
          });
        },
      },

      deleteUser: {
        type: UUIDType,
        args: {
          id: { type: UUIDType }
        },
        resolve: async (_source, { id }, context) => {
          const prisma = context as PrismaClient;
          await prisma.user.delete({
            where: {
              id: id as string,
            },
          });
        },
      },

      subscribeTo: {
        type: user,
        args: {
          userId: { type: UUIDType },
          authorId: { type: UUIDType },
        },
        resolve: async (_source, { userId, authorId }, context) => {
          const prisma = context as PrismaClient;

          return await prisma.user.update({
            where: {
              id: userId as string,
            },
            data: {
              userSubscribedTo: {
                create: {
                  authorId: authorId as string,
                },
              },
            },
          });
        },
      },

      unsubscribeFrom: {
        type: UUIDType,
        args: {
          userId: { type: UUIDType },
          authorId: { type: UUIDType },
        },
        resolve: async (_source, { userId, authorId }, context) => {
          const prisma = context as PrismaClient;

          await prisma.subscribersOnAuthors.delete({
            where: {
              subscriberId_authorId: {
                subscriberId: userId as string,
                authorId: authorId as string,
              },
            },
          });
        },
      },
    }),
  });

  const schema = new GraphQLSchema({
    query: rootQuery,
    mutation: rootMutation,
    types: [member, MemberTypeId, post, profile, user, CreatePostInput, CreateProfileInput, CreateUserInput, ChangeUserInput, ChangePostInput, ChangeProfileInput],
  });

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const { query, variables } = req.body;
      const source = new Source(query);
      const customErrors = validate(schema, parse(query), [depthLimit(5)]);

      if (customErrors.length) {
        return { errors: customErrors };
      }

      return await graphql({
        schema,
        source,
        variableValues: variables,
        contextValue: prisma,
      });
    },
  });
};

export default plugin;
