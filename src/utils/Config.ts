interface GmailEmailServiceKey {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
}

interface SpaceKeys {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    imageBucket: string;
    uploadImageUrl: string;
}

let SpaceKeysConfig: SpaceKeys = !process.env.production ? require("../../SpaceKeysConfig.json") : {
    endpoint: process.env.space_keys_endpoint,
    accessKey: process.env.space_keys_accessKey,
    secretKey: process.env.space_keys_secretKey,
    imageBucket: process.env.space_keys_imageBucket,
    uploadImageUrl: process.env.space_keys_uploadImageUrl
}

interface BasicAppConfig {
    GmailServicePassword: string;
    GoogleMapsApiKey: string;
    StripeKey: string;
    SeceretKey: string;
    PORT: number;
    CLEARDB_DATABASE_NEW_URL: string | undefined;
    NODE_ENV: string | undefined;
    STRIPE_WEBHOOK_SECRET: string | undefined;
    STRIPE_WEBHOOK_CONNECT_SECRET: string | undefined;
    RESEND_API_KEY: string;
}

const BasicConfig: BasicAppConfig = {
    GoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",

    GmailServicePassword: process.env.gmailPWD || "",

    StripeKey: process.env.STRIPE_KEY || "",

    SeceretKey: process.env.SECRET_KEY || "shhhh",

    PORT: process.env.PORT ? parseInt(process.env.PORT) : 3555,

    CLEARDB_DATABASE_NEW_URL: process.env.CLEARDB_DATABASE_NEW_URL,

    NODE_ENV: process.env.NODE_ENV,

    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,

    STRIPE_WEBHOOK_CONNECT_SECRET: process.env.STRIPE_WEBHOOK_CONNECT_SECRET,

    RESEND_API_KEY: process.env.RESEND_API_KEY || ''
}

interface AppConfig  {
    BasicConfig: BasicAppConfig;
    SpaceKeysConfig: SpaceKeys;
    TEST_SERVER: Boolean;
}

export const AppConfig: AppConfig = {
    SpaceKeysConfig,

    BasicConfig,
    
    TEST_SERVER: process.env.CLEARDB_DATABASE_NEW_URL ? true : false
}
