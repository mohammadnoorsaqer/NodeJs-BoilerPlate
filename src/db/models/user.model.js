module.exports = (sequelize, DataTypes) => {
	const users = sequelize.define(
		'users',
		{
			id: {
				type: DataTypes.UUID,
				allowNull: false,
				primaryKey: true,
				defaultValue: DataTypes.UUIDV4, // generates a new UUID automatically
			},
			username: {
				type: DataTypes.STRING(100),
				allowNull: true,
			},
			username_ar: {
				type: DataTypes.STRING(100),
				allowNull: false,
			},
			email: {
				type: DataTypes.STRING(255),
				allowNull: false,
				unique: true,
			},
			password_hash: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			phone_number: {
				type: DataTypes.STRING(155),
				unique: true,
				allowNull: true,
			},
			gender: {
				type: DataTypes.ENUM('male', 'female'),
				allowNull: true,
			},
			role: {
				type: DataTypes.ENUM(
					'user',
					'admin',
					'superadmin',
				),
				allowNull: false,
			},
			firebase_token: {
				type: DataTypes.STRING(255),
				allowNull: true,
			},
			firebase_uid: {
				type: DataTypes.STRING(128),
				allowNull: true,
				unique: true,
				comment: 'Firebase Authentication UID',
			},
			on_boarding: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			last_login: {
				type: DataTypes.DATE,
				allowNull: true,
			},
			is_active: {
				type: DataTypes.BOOLEAN,
				defaultValue: true,
				allowNull: false,
			},
			token_version: {
				type: DataTypes.INTEGER,
				defaultValue: 0,
				allowNull: false,
				comment: 'Increment this to invalidate all user tokens instantly',
			},
			reason_en: {
				type: DataTypes.STRING(255),
				allowNull: true,
				comment:
					'Reason for deactivation/reactivation/deletion in English',
			},
			is_deleted: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			deletion_request_approved: {
				type: DataTypes.BOOLEAN,
				defaultValue: false,
				allowNull: false,
			},
			latitude: {
				type: DataTypes.DECIMAL(10, 6),
				allowNull: true,
			},
			longitude: {
				type: DataTypes.DECIMAL(10, 6),
				allowNull: true,
			},
			reason_ar: {
				type: DataTypes.STRING(255),
				allowNull: true,
				comment:
					'Reason for deactivation/reactivation/deletion in Arabic',
			},
			date_of_birth: {
				type: DataTypes.DATEONLY,
				allowNull: true,
			},
		},
		{
			tableName: 'users',
			timestamps: true,
			underscored: true,
		}
	);
	return users;
};
