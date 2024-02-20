import * as models from "../models";
import jwt from "jsonwebtoken";
import { Mailer } from "./Emails";

export class Utils {
    static SECRET_KEY = process.env.SECRET_KEY || "shhhh";

    static KmTomilesConversion = 0.621371;

    static milesFilterLeway = 2;

    static LOGIN_TOKEN_TYPE = {
        USER: "USER",
        ORGANIZER: "ORGANIZER"
    } as const;

    static CustomError = class extends Error {
        constructor( message: string, name= "CustomError" ) {
            super(message);
            this.name = name;
        }
    }

    static Mailer = Mailer;

    static getCravingsWebUrl = () => {
        return process.env.NODE_ENV === "production" ? "https://www.cravingsinc.us" : "http://localhost:3000"
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
        try {
            let unHashedToken: any = jwt.verify(token, this.SECRET_KEY);

            if ( unHashedToken ) {
                if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.USER ) {
                    let user = await models.Users.findOne({
                        where: { id: unHashedToken.id },
                        relations
                    });
    
                    if ( user ) return user;
                }
            }    
        }catch( e ) {}

        throw new Utils.CustomError("User does not exist.");
    }

    static async verifyPasswordChangeToken( token: string ) {
        try {
            let unHashedToken: any = jwt.verify( token, this.SECRET_KEY );
        
            if ( unHashedToken ) {
                if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.USER && unHashedToken.command === 'change-password' ) {
                    let pwc = await models.UserPasswordChange.findOne({ where: { id: unHashedToken.pwc }, relations: [ "user" ] })
                    
                    if ( pwc ) return pwc;
                }  
            }
        }catch( e ) {} 

        throw new Utils.CustomError("Token is not valid");
    }

    static async getOrganizerFromJsWebToken( token: string, relations: string[] = [] ) : Promise<models.Organizers> {
        let unHashedToken: any = jwt.verify(token, this.SECRET_KEY);

        if ( unHashedToken ) {
            if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.ORGANIZER ) {
                let organizer = await models.Organizers.findOne({
                    where: { id: unHashedToken.id },
                    relations
                });

                if ( organizer ) return organizer;
            }
        }

        throw new Utils.CustomError("User does not exist.");
    }

    static getMiles( start: { longitude: number, latitude: number }, end: { longitude: number, latitude: number } ) {
        let km  = Math.acos(
            Math.sin(start.latitude) * Math.sin(end.latitude) + Math.cos(start.latitude) * Math.cos(end.latitude) * Math.cos(end.longitude - start.longitude)
        ) * 6371;

        return km*Utils.KmTomilesConversion;
    }

    static shortenNumericString( num: number ) {
        if ( num < 1000 ) return `${num}`;
        else if ( num < 1_000_000 ) return `${num/1000}k`;
        else if ( num < 1_000_000_000 ) return `${num/1_000_000}m`;
        else return `${num/1_000_000_000}b`;
    }

    static shortenMinutesToString(minutes: number) {
        if ( minutes / 60 < 1 ) {
            let div = Math.round(minutes);
            return `${div > 1 ? div : 1}m`;
        }
        else if ( minutes / ( 60 * 60 ) < 60 ) {
            let div = Math.round(minutes/( 60 * 60 ));
            return `${div > 1 ? div : 1}h`;
        }
        else if ( minutes / ( 60 * 60 * 24 ) < 360 ) {
            let div = Math.round(minutes/( 60 * 60 * 24 ));

            return `${div > 1 ? div : 1}d`;
        }
        else {
            let div = Math.round(minutes/( 60 * 60 * 24 * 7 ))

            return `${div > 1 ? div : 1}w`;
        }
    }
}
