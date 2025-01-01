import * as models from "../models";
import jwt from "jsonwebtoken";
import { Mailer } from "./Emails";
import { GoogleMapsUtils } from "./GoogleMapsUtils";
import { AppConfig } from "./Config";

export class Utils {

    static KmTomilesConversion = 0.621371;

    static milesFilterLeway = 2;

    static AppConfig = AppConfig;

    static SECRET_KEY = Utils.AppConfig.BasicConfig.SeceretKey;

    static googleMapsService = GoogleMapsUtils.getMaps( Utils.AppConfig.BasicConfig.GoogleMapsApiKey );

    static LOGIN_TOKEN_TYPE = {
        USER: "USER",
        ORGANIZER: "ORGANIZER",
        ORGANIZER_MEMBERS: "ORGANIZER_MEMBERS",
    } as const;

    static CustomError = class extends Error {
        constructor( message: string, name= "CustomError" ) {
            super(message);
            this.name = name;
        }
    }

    static Mailer = Mailer.getMailer();

    static getCravingsWebUrl = () => {
        return Utils.AppConfig.BasicConfig.NODE_ENV === "production" ? "https://www.cravingsinc.us" : "http://localhost:3000"
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
    
    static getRegenToken( token: string ) {
        try {
            const decoded = jwt.decode( token ) as jwt.JwtPayload;

            const secondsInWeek = 604_800;

            const currentTime = Math.floor( Date.now() / 1000 );

            const expiresIn = ( decoded.exp || 0 ) - currentTime;

            return expiresIn > secondsInWeek ? token : jwt.sign( { ...decoded, exp: ( decoded.exp || 0 ) + ( secondsInWeek * 2) }, this.SECRET_KEY);
        } catch( e ) {
            console.log( e );
        }

        return new Utils.CustomError('Problem retrieving token');
    }

    static async verifyUserPasswordChangeToken( token: string ) {
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

    static async verifyOrgPasswordChangeToken( token: string ) {
        try {
            let unHashedToken: any = jwt.verify( token, this.SECRET_KEY );

            if ( unHashedToken ) {
                if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.ORGANIZER && unHashedToken.command === 'change-password' ) {
                    let pwc = await models.OrganizerPasswordChange.findOne({ where: { id: unHashedToken.pwc }, relations: ['organizer'] });

                    if ( pwc ) return pwc;
                }
            }
        }catch( e ) {}

        throw new Utils.CustomError("Token is not valid");
    }

    static async verifyOrgMemberPasswordChangeToken( token: string ) {
        try {
            let unHashedToken: any = jwt.verify( token, this.SECRET_KEY );

            if ( unHashedToken ) {
                if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS && unHashedToken.command === 'change-password' ) {
                    let pwc = await models.OrganizerMemberPasswordChange.findOne({ where: { id: unHashedToken.pwc }, relations: ['member'] });

                    if ( pwc ) return pwc;
                }
            }
        }catch( e ) {}

        throw new Utils.CustomError("Token is not valid");
    }

    static async verifyOrgTeamMemberInviteToken( token: string ) {
        try {
            let unHashedToken: any = jwt.verify( token, this.SECRET_KEY );

            if ( unHashedToken ) {
                if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS && unHashedToken.command === 'invite-team-member' ) {
                    let teamMember = await models.OrganizerMembers.findOne({ where: { id: unHashedToken.id }, relations: [ 'organizer' ] });

                    if ( teamMember ) return teamMember;
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

    static async getOrgFromOrgOrMemberJsWebToken( token: string, relations: string[] = [], adminRequirement: boolean = false ): Promise<models.Organizers> {
        let org: models.Organizers;

        try {
            org = await this.getOrganizerFromJsWebToken( token, relations);
        }catch {
            let orgMember = await this.getOrganizerMemberFromJsWebToken( token, relations );

            if ( adminRequirement && orgMember.title !== 'Admin' ) {
                throw new Utils.CustomError("User does not have the correct permissions.");
            }

            org = orgMember.organizer;
        }

        return org;
    }

    static async getOrganizerMemberFromJsWebToken( token: string, relations: string[] = [] ): Promise<models.OrganizerMembers> {
        let unHashedToken: any = jwt.verify(token, this.SECRET_KEY);

        if ( unHashedToken ) {
            if ( unHashedToken.type === Utils.LOGIN_TOKEN_TYPE.ORGANIZER_MEMBERS ) {
                let orgMember = await models.OrganizerMembers.findOne({
                    where: { id: unHashedToken.id },
                    relations: ['organizer', ...relations.map( val => `organizer.${val}`)]
                });

                if ( orgMember ) return orgMember;
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
