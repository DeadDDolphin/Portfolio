import confluenceApiRequest from "./confluenceApiRequest";
import * as Types from '../../../types/types';
import updatePage from "./updatePage";
import uploadFile from "./uploadFile";
import ResponseObj from "../../../classes/ResponseObj";


export default function uploadData(pageId: number | string, documentType: string, uploadingData:Types.IConfluUploadingData, parentPageTitle?: string): Promise<ResponseObj<null|number|string>> {
    return new Promise(async (resolve, reject) => {
        try {

            const pageDataResult = await confluenceApiRequest({
                methodType: "getPageDataById",
                data: {
                    pageId: pageId
                }
            });
            let pageTitle = '';
            if(parentPageTitle) {
                pageTitle = `${parentPageTitle}_${documentType}`;
            } else {
                pageTitle = (pageDataResult.data as Types.IConfluPageData).pageTitle;
            }

            const prevBody = (pageDataResult.data as Types.IConfluPageData).bodyContent;

            //Находим ссылки на странице
            const regexpUrl = /(?<=href=")(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@"<>]*/gi;
            const matches = prevBody.match(regexpUrl);

            //Убираем повторения ссылок
            const urls = [...Array.from(new Set(matches))];

            const version = (pageDataResult.data as Types.IConfluPageData).pageVersion + 1;

            const url = uploadingData.url ? uploadingData.url : urls && urls.length > 0 ? urls[0] : "";

            let verificationPart = "<p> \
                <img class=\"emoticon emoticon-cross\" src=\"/s/qgbv7z/8703/189cb2l/_/images/icons/emoticons/error.svg\" data-emoticon-name=\"cross\" alt=\"(error)\" /> \
                Верификация не пройдена \
            <\/p>";
            if (uploadingData.verification) {
                verificationPart = "\n<p> \
                    <img class=\"emoticon emoticon-tick\" src=\"/s/qgbv7z/8703/189cb2l/_/images/icons/emoticons/check.svg\" data-emoticon-name=\"tick\" alt=\"(tick)\" /> \
                    Успешно верифицирован \
                <\/p>";
            }
            
            const bodyPattern =
                `<div class=\"contentLayout2\">
                    \n<div class=\"columnLayout single\" data-layout=\"single\">
                        \n<div class=\"cell normal\" data-type=\"normal\">
                            \n<div class=\"innerCell\"> 
                                ${verificationPart}
                            <\/div>
                        \n<\/div>
                    \n<\/div>
                    \n<div class=\"columnLayout single\" data-layout=\"single\">\n<div class=\"cell normal\" data-type=\"normal\">
                        \n<div class=\"innerCell\">
                            \n<p>
                                ${url.length > 0 ?
                        `<a href=\"${url}\" rel=\"nofollow\">
                                    ${url}
                                <\/a>` : ""}
                                ${uploadingData.file || prevBody.includes('*Файл во вложениях') ?
                        "*Файл во вложениях" : ""}
                            <\/p>
                        <\/div>
                    \n<\/div>
                \n<\/div>
            \n<\/div>`;

            const updateResult = await updatePage(pageId, pageTitle, bodyPattern, version);
            let uploadFileRes = new ResponseObj(true, 200, null, null, null);

            if (uploadingData.file) {
                uploadFileRes = await uploadFile(pageId, uploadingData.file, documentType) as ResponseObj<null>;
            }
            if(updateResult.success && uploadFileRes.success) {
                resolve(new ResponseObj(true, 200, pageId, null, null));
            } else {
                reject(new ResponseObj(false, 500, null ,{
                    upload_url_error: !updateResult.success ? updateResult.error: null,
                    upload_file_error: !uploadFileRes.success ? uploadFileRes.error : null
                }, `Не удалось загрузить данные в страницу ${pageId}, см. error`))
            }
        } catch (error) {
            reject(error)
        }
    });
}