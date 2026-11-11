import validator from 'validator';
import type { CustomHelpers, ErrorReport } from 'joi';

const PASSWORD_RULE_MESSAGE =
  'Password Should be Atleast 8 Characters Long one Uppercase, one Lowercase, one Number and one Special Character';

export const password = (
  value: string,
  helpers: CustomHelpers,
): string | ErrorReport => {
  if (!validator.isStrongPassword(value)) {
    return helpers.error('any.invalid', { message: PASSWORD_RULE_MESSAGE });
  }
  return value;
};
