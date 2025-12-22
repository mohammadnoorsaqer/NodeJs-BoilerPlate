"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },

      username: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      username_ar: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      phone_number: {
        type: Sequelize.STRING(155),
        allowNull: true,
        unique: true,
      },

      gender: {
        type: Sequelize.ENUM("male", "female"),
        allowNull: true,
      },

      role: {
        type: Sequelize.ENUM("user", "admin", "superadmin"),
        allowNull: false,
      },

      firebase_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      firebase_uid: {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true,
      },

      on_boarding: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      is_active_user: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      is_deleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      deletion_request_approved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      reason_en: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      reason_ar: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      latitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
      },

      longitude: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
      },

      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      token_version: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: "Increment this to invalidate all user tokens instantly",
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn("now"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("users");

    // IMPORTANT: drop ENUM types manually (PostgreSQL)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_gender";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_users_role";'
    );
  },
};
