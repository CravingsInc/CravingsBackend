import { Resolver, Mutation, Arg } from "type-graphql";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import * as models from "../models";

import { Utils, stripeHandler } from "../utils";

@Resolver()
export class FoodTruckResolver {
    @Mutation( returns => String )
    async CreateFoodTruckAccount( @Arg("foodTruckName") foodTruckName: string, @Arg("email") email: string, @Arg("password") password: string ) {
        let foodTruck : models.FoodTrucks;

        if ( foodTruckName.length < 1 || email.length < 1 || password.length < 1 || !(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(email)) throw new Utils.CustomError("Please fill out form correctly");

        try {
            foodTruck = await models.FoodTrucks.create({
                truckName: foodTruckName,
                email,
                password: await bcrypt.hash(password, 12)
            }).save();
        }catch(e) {
            console.log(e);
            throw new Utils.CustomError("Food Truck Name Already Exist");
        }

        if ( foodTruck ) {
            try {
                foodTruck.stripeConnectId = ( await stripeHandler.createConnectAccount(email, foodTruck.id ) ).id;
                await foodTruck.save();
            }catch(e) {
                console.log(e);

                await foodTruck.remove();
                throw new Utils.CustomError("Problem Creating Food Truck Account");
            }

            return jwt.sign(
                {
                    ...await Utils.generateJsWebToken(foodTruck.id),
                    type: "foodTruck"
                },
                Utils.SECRET_KEY,
                { expiresIn: "2w" }
            )
        }
    }

    @Mutation( returns => String ) 
    async FoodTruckLogIn( @Arg("truckName") truckName: string, @Arg("password") password: string ) {
        let foodTruck = await models.FoodTrucks.findOne({ where: { truckName } });

        if ( !foodTruck ) foodTruck = await models.FoodTrucks.findOne({ where: { email: truckName }}) // Just incase they are using there email

        if ( foodTruck ) {
            if ( await bcrypt.compare(password, foodTruck.password) ) {
                return jwt.sign(
                    {
                        ...await Utils.generateJsWebToken(foodTruck.id),
                        type: "foodTruck"
                    },
                    Utils.SECRET_KEY,
                    { expiresIn: "2w" }
                );
            }
        }

        throw new Utils.CustomError("Invalid credentials. Please try again")
    }
}
