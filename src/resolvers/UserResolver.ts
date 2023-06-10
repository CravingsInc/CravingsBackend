import { Resolver, Mutation, Arg } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class UserResolver {
    @Mutation( returns => String )
    async CreateUserAccount( @Arg("username") username: string, @Arg("email") email: string, @Arg("password") password: string ) {
        let user : models.Users;

        if ( username.length < 1 || email.length < 1 || password.length < 1 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email)) throw new Utils.CustomError("Please fill out form correctly");

        // This will only throw an error if the username is not unique. And if isn't then we want to have a custom error to catch.
        try {
            user = await models.Users.create({
                username,
                email,
                password: await bcrypt.hash(password, 12)
            }).save();
        }catch(e) { 
            console.log(e);
            throw new Utils.CustomError("Username Already exist"); 
        };

        if ( user ) {
            try {
                user.stripeCustomerId = ( await stripeHandler.createCustomer(email, user.id) ).id;
                await user.save();

            }catch(e) {
                console.log(e)
                await user.remove(); // If there was a error then the user will be removed since they will most likely wanna recreate account and try again
                throw new Utils.CustomError("Problem Creating Customer Account") 
            };

            return jwt.sign(
                await Utils.generateJsWebToken(user.id), 
                Utils.SECRET_KEY, 
                { expiresIn: "2w" }
            );
        }
    }
}
