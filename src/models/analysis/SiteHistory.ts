import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, BaseEntity, UpdateDateColumn, ManyToOne } from "typeorm"
import { ObjectType, Field, ID, registerEnumType } from "type-graphql";
import { Users } from "../users";
import { Organizers } from "../organizers";

export enum UrlVisitedType {
    HOME = "/",
    REGISTER = "/register",
    SIGN_IN = "/sign/in",
    EVENTS = "/events",
    EVENTS_DETAILS = "/event/{eventID}",
    EVENTS_DETAILS_TICKET  = "/events/{eventID}/ticket",
    CONTACT = "/contact",
    CHANGE_PASSWORD = "/change-password/",
    RESERVE = "/reserve",
    USER_HOME = "/home"
}

@Entity()
@ObjectType()
export class SiteHistory extends BaseEntity {
    @Field( () => ID )
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Field( () => Users )
    @ManyToOne( () => Users, u => u.siteHistory, { onDelete: "CASCADE" })
    user?: Users;

    @Field( () => Organizers )
    @ManyToOne( () => Organizers, o => o.siteHistory, { onDelete: "CASCADE" })
    organizer?: Organizers;

    /**
     * @description Full URL that was visited for example if the url visited was ```https://www.cravingsinc.us/events/{eventId}``` it will load ```Event Detail Page```.
    */
    @Field()
    @Column()
    urlVisited: string;

    /**
     * @description Full URL that was visited for example if the url visited was ```https://www.cravingsinc.us/events/{eventId}``` it will load that exactly.
    */
    @Field()
    @Column()
    urlFull: string;

    @Field()
    @Column()
    isMobile: boolean;

    @Field()
    @Column()
    isTablet: boolean;

    @Field()
    @Column()
    isDesktop: boolean;

    @Field()
    @Column()
    isSmartTV: boolean;

    @Field()
    @Column()
    isWearable: boolean;

    @Field()
    @Column()
    isConsole: boolean;

    @Field()
    @Column()
    isEmbedded: boolean;

    @Field()
    @Column()
    isAndroid: boolean;

    @Field()
    @Column()
    isWinPhone: boolean;

    @Field()
    @Column()
    isIOS: boolean;

    @Field()
    @Column()
    isChrome: boolean;

    @Field()
    @Column()
    isFireFox: boolean;

    @Field()
    @Column()
    isSafari: boolean;

    @Field()
    @Column()
    isOpera: boolean;

    @Field()
    @Column()
    isIE: boolean;

    @Field()
    @Column()
    isEdge: boolean;

    @Field()
    @Column()
    isYandex: boolean;

    @Field()
    @Column()
    isChromium: boolean;

    @Field()
    @Column()
    isMobileSafari: boolean;

    @Field()
    @Column()
    isSamsungBrowser: boolean;

    @Field()
    @CreateDateColumn()
    dateCreated: Date;
}