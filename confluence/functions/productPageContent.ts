import getDateString from "../../../functions/getDateString";


export default function productPageContent(productName: string, itemPpiLink: null | string, itemSolLink: string | null): string {
    const today = getDateString(new Date());
    const linksPart = `${itemPpiLink && itemPpiLink !== 'null' ?
    `<a href=\"${itemPpiLink}\" rel=\"nofollow\">
        Ссылка на PPInfo
    <\/a>` : ''}
${itemSolLink && itemSolLink !== 'null' ?
    `<a href=\"${itemSolLink}\" rel=\"nofollow\">
        Ссылка на SoL
    <\/a>` : ''}`;
    return `
        <div class=\"contentLayout2\">
            \n<div class=\"columnLayout single\" data-layout=\"single\">
                \n<div class=\"cell normal\" data-type=\"normal\">
                    \n<div class=\"innerCell\"> 
                        \n<p>
                            Дата создания - ${today}. ${linksPart}
                        <\/p>
                    <\/div>
                \n<\/div>
            \n<\/div>
        \n<\/div>
        `;   
}