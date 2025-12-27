export const bookSchema = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        title: {
            type: 'string'
        },
        author: {
            type: 'string'
        },
        cover: {
            type: 'string'
        },
        progress: {
            type: 'number',
            default: 0
        },
        totalWords: {
            type: 'number',
            default: 0
        },
        content: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        lastRead: {
            type: 'number',
            default: 0
        }
    },
    required: ['id', 'title', 'content']
} as const;
