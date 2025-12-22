const validtor = require("validator");
const password=(value,helpers)=>
{
    if(!validtor.isStrongPassword(value))
    {
        helpers.message="Password Should be Atleast 8 Characters Long one Uppercase, one Lowercase, one Number and one Special Character";
    }
    return value;
}
module.exports=
{
    password
}