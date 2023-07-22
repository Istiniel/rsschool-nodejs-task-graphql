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
    }),
  });

  const schema = new GraphQLSchema({
    query: rootQuery,
    types: [member, MemberTypeId, post],
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
