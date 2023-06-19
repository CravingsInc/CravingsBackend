import * as models from "../models";
import jwt from "jsonwebtoken";
import { getDistance } from 'geolib';

export class Utils {
    static SECRET_KEY = process.env.SECRET_KEY || "shhhh";

    static milesConversion = 0.000621371;

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

    static getMiles( start: { longitude: number, latitude: number }, end: { longitude: number, latitude: number } ) {
        return (
            getDistance(
                start,
                end,
                1
            ) || 0
        ) * Utils.milesConversion;
    }

    static shortenNumericStrign( num: number ) {
        if ( num < 1000 ) return `${num}`;
        else if ( num < 1_000_000 ) return `${num/1000}k`;
        else if ( num < 1_000_000_000 ) return `${num/1_000_000}m`;
        else return `${num/1_000_000_000}b`;
    }

    static shortenMinutesToString(minutes: number) {
        if ( minutes < 1 ) return `${Math.round(minutes)}s`;
        else if ( minutes / 60 < 1 ) return `${Math.round(minutes/60)}m`;
        else if ( minutes / ( 60 * 60 ) < 60 ) return `${Math.round(minutes/( 60 * 60 ))}h`;
        else if ( minutes / ( 60 * 60 * 24 ) < 360 ) return `${Math.round(minutes/( 60 * 60 * 24 ))}d`;
        else return `${minutes/( 60 * 60 * 24 * 7 )}w`;
    }
}
