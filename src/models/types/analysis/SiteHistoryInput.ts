import { InputType, Field } from "type-graphql";

@InputType()
export class SiteHistoryInput {
    @Field({ nullable: true })
    token?: string;

    @Field({ nullable: true })
    craving?: "ticket" | "events";

    @Field()
    urlFull: string;

    @Field()
    isMobile: boolean;

    @Field()
    isTablet: boolean;

    @Field()
    isDesktop: boolean;

    @Field()
    isSmartTV: boolean;

    @Field()
    isWearable: boolean;

    @Field()
    isConsole: boolean;

    @Field()
    isEmbedded: boolean;

    @Field()
    isAndroid: boolean;

    @Field()
    isWinPhone: boolean;

    @Field()
    isIOS: boolean;

    @Field()
    isChrome: boolean;

    @Field()
    isFireFox: boolean;

    @Field()
    isSafari: boolean;

    @Field()
    isOpera: boolean;

    @Field()
    isIE: boolean;

    @Field()
    isEdge: boolean;

    @Field()
    isYandex: boolean;

    @Field()
    isChromium: boolean;

    @Field()
    isMobileSafari: boolean;

    @Field()
    isSamsungBrowser: boolean;
}
