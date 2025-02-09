const { Model, STRING, DATE, JSONB } = require('sequelize')
const { dbConnections } = require('../database/connection')

class ProgrammeModule extends Model {}

ProgrammeModule.init(
  {
    id: {
      primaryKey: true,
      type: STRING,
    },
    code: {
      type: STRING,
    },
    name: {
      type: JSONB,
    },
    type: {
      type: STRING,
    },
    studyLevel: {
      type: STRING,
    },
    organization_id: {
      type: STRING,
      references: {
        model: 'organization',
        key: 'id',
      },
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'programme_module',
    tableName: 'programme_modules',
  }
)

module.exports = ProgrammeModule
