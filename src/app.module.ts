import { Module } from "@nestjs/common";
import { TopicsModule } from './topics/topics.module';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule } from "@nestjs/config";


@Module({
    exports: [],
    providers: [],
    controllers: [],
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        TopicsModule, 
        CategoriesModule
    ]
})
export class AppModule { }