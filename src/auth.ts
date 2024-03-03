import {account, loginRes, loginResData} from "~/types/v3";
import bodyToString from "./utils/body";
import {Session} from "./session";
import {EstablishmentInfo} from "~/utils/types/establishments";
import {AccountInfo, Profile} from "~/utils/types/accounts";
import {authRequestData} from "~/types/v3/requests/student";

class Auth {

    session: Session;

    constructor(session: Session) {
        this.session = session;
    }

    async login(username: string, password: string, uuid: string | boolean = false) {
        const url = "/login.awp?v=4.37.1";
        let body = null;
        if(uuid) {
            body = {
                identifiant: username,
                motdepasse: encodeURIComponent(password),
                isRelogin: false,
                sesouvenirdemoi: true,
                uuid: uuid
            };
        } else {
            body = {
                identifiant: username,
                motdepasse: encodeURIComponent(password),
                isRelogin: false,
                uuid: ""
            } as authRequestData;
        }

        return await this.session.request.post(url, bodyToString(body)).then((response: loginRes) => {
            if (response.code === 200) {
                const data = response.data as loginResData;

                this.session._token = response.token;
                const accounts = data.accounts[0];

                this.session.modules = accounts.modules;
                this.session.settings = accounts.parametresIndividuels;
                this.session.school = this.getEtabInfo(accounts);
                this.session.student = this.getStudentInfo(accounts);
                this.session.isLoggedIn = true;
            }
        });
    }

    async renewToken(username: string, uuid: string) {
        const url = "/login.awp";
        const body = {
            identifiant: username,
            motdepasse: "???",
            typeCompte: "E",
            isRelogin: true,
            uuid: uuid
        };
        return await this.session.request.post(url, bodyToString(body)).then((response: loginRes) => {
            if (response.code === 200) {
                const data = response.data as loginResData;

                this.session._token = response.token;
                const accounts = data.accounts[0];

                this.session.modules = accounts.modules;
                this.session.settings = accounts.parametresIndividuels;
                this.session.school = this.getEtabInfo(accounts);
                this.session.student = this.getStudentInfo(accounts);
                this.session.isLoggedIn = true;
            }
        });
    }


    setToken(token: string, id: number) {
        this.session._token = token;
        this.session.student = { id: id };
        this.session.isLoggedIn = true;
        return true;
    }

    getEtabInfo(data: account): EstablishmentInfo {
        const profile= data.profile as Profile;
        return {
            name: profile.nomEtablissement ?? "Établissement non spécifié",
            id: profile.idEtablissement ?? "",
            rne: profile.rneEtablissement ?? "",
            logo: data.logoEtablissement,
        };
    }

    getStudentInfo(data: account): AccountInfo {
        const profile = data.profile as Profile;
        return {
            id: data.id,
            uid: data.uid,
            identifiant: data.identifiant,
            type: data.typeCompte,
            lastConnexion: data.lastConnexion,
            civilite: data.civilite,
            prenom: data.prenom,
            nom: data.nom,
            email: data.email,
            tel: profile.telPortable ?? "",
            sexe: profile.sexe ?? "",
            classe: profile.classe,
            photo: profile.photo ?? ""
        };
    }
}

export {
    Auth
};
