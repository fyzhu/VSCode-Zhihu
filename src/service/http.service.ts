
import * as vscode from "vscode";
import { IProfile } from "../model/target/target";
import { DefaultHTTPHeader } from "../const/HTTP";
import * as fs from "fs";
import * as path from "path";
import * as httpClient from "request-promise";
import { CookieJar, Cookie, Store } from "tough-cookie";
import { ZhihuDomain } from "../const/URL";

export class HttpService {
	public profile: IProfile;

	constructor (
		protected context: vscode.ExtensionContext,
		protected cookieJar: CookieJar,
		protected store: Store
		) {
	}
	
	public async sendRequest(options): Promise<any> {
		if (options.headers == undefined) {
			options.headers = DefaultHTTPHeader;
	
			try {
				options.headers['cookie'] = this.cookieJar.getCookieStringSync(options.uri);
				// options.headers['cookie'] = fs.readFileSync(path.join(this.context.extensionPath, 'cookie.txt'), 'utf8');
			} catch(error) {
				// fs.writeFileSync(path.join(this.context.extensionPath, 'cookie.txt'), '');
				console.log(error)
			}
		}	
		options.headers['cookie'] = this.cookieJar.getCookieStringSync(options.uri);
		// headers['cookie'] = cookieService.getCookieString(options.uri);
		var returnBody;
		if (options.resolveWithFullResponse == undefined || options.resolveWithFullResponse == false) {
			returnBody = true;
		} else {
			returnBody = false;
		}
		options.resolveWithFullResponse = true;
	
		options.simple = false;

		var resp;
		try {
			resp = await httpClient(options);
			if (resp.headers['set-cookie']) {
				resp.headers['set-cookie'].map(c => Cookie.parse(c))
				.forEach(c => this.cookieJar.setCookieSync(c, options.uri));
			}	
		} catch (error) {
			vscode.window.showInformationMessage('请求错误');
			return Promise.resolve(null);
		}
		if (returnBody) {
			return Promise.resolve(resp.body)
		} else {
			return Promise.resolve(resp);
		}
	
	}

	public clearCookie(domain?: string) {
		if (domain == undefined) {
			this.store.removeCookies(ZhihuDomain, null, err => console.log(err));
		}
	}
}