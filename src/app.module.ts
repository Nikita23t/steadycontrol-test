import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { RutrackerModule } from "./rutracker/rutracker.module";



@Module({
    exports: [],
    providers: [],
    controllers: [],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        MongooseModule.forRoot(`${process.env.MONGODB_URI}`),
        RutrackerModule,
    ]
})
export class AppModule { }