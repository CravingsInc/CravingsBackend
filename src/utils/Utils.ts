import * as models from "../models";
import jwt from "jsonwebtoken";

export class Utils {
    static SECRET_KEY = process.env.SECRET_KEY || "shhhh";

    static CustomError = class extends Error {
        constructor( message: string, name= "CustomError" ) {
            super(message);
            this.name = name;
        }
    }

    /**
     * Generates a primary key for a given table.
     * @param checkID - Function to check whether or not the ID is valid.
     * @returns New created id for a primary key
     */
    static async generateID(checkID: (result: string) => Promise<boolean>): Promise<string> {
        var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var result = ""
        var charactersLength = characters.length;

        for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        if (await checkID(result)) return this.generateID(checkID);

        return result;
    }
    
    /**
     * Genereate a random unsigned JSONToken.
     * @param user - The user, this is used to add to the json token, to make it really unique
    */
    static async generateJsWebToken( id: string ): Promise<{ [key: string]: string }> {
        let genKey = await this.generateID(
            async (result: string): Promise<boolean> => {
                return result ? false : true
            }
        )
        return { token: genKey, id: id };
    }

    static async getUserFromJsWebToken( token: string, relations: string[] = [] ) : Promise<models.Users> {
        let unHashedToken: any = jwt.verify(token, this.SECRET_KEY);

        if ( unHashedToken ) {
            if ( unHashedToken.type === "user" ) {
                let user = await models.Users.findOne({
                    where: { id: unHashedToken.id },
                    relations
                });

                if ( user ) return user;
            }
        }

        throw new Utils.CustomError("User does not exist.");
    }

    static async getFoodTruckFromJsWebToken( token: string, relations: string[] = [] ) : Promise<models.FoodTrucks> {
        let unHashedToken: any = jwt.verify(token, this.SECRET_KEY);

        if ( unHashedToken ) {
            if ( unHashedToken.type === "foodTruck" ) {
                let truck = await models.FoodTrucks.findOne({
                    where: { id: unHashedToken.id },
                    relations
                });

                if ( truck ) return truck;
            }
        }

        throw new Utils.CustomError("User does not exist.");
    }
}
