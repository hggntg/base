import { RouterModule, Routes, Router } from '@angular/router';
import { NgModule } from '@angular/core';
import { WelcomeComponent } from './welcome/welcome.component';
import { QuickStartComponent } from './quick-start/quick-start.component';
import { DocumentComponent } from './document/document.component';

export const routes: Routes = [
    { path: "", component: WelcomeComponent},
    { path: "quick-start", component: QuickStartComponent},
    { path: "document", component: DocumentComponent },
    { path: "**", redirectTo: ""}
]


@NgModule({
    imports:[
        RouterModule.forRoot(routes)
    ],
    exports: [
        RouterModule,
        WelcomeComponent,
        QuickStartComponent,
        DocumentComponent
    ],
    declarations:[
        WelcomeComponent,
        QuickStartComponent,
        DocumentComponent
    ]
})
export class AppRouting{

}