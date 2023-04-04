<template>
    <div v-if="item" class="verification-doc__content">
        <div class="verification-doc__proof">
            Данные на Confluence:
            <p class="verification-confluence-link" v-html="confluenceLink()"></p>
        </div>
        <div class="verification-doc__proof">
            Статус верификации:
            <span v-if="verificationStatus"><em style="color: rgb(48 255 20 / 68%);">Верифицирован</em></span>
            <span v-else><em style="color: rgb(255 63 63 / 77%);">Не верифицирован</em></span>
        </div>
        <div class="verification-btns__content">
            <div class="verification-btns-group">
                <b-overlay :show="isSavingDeleteProcess" rounded="sm">
                    <button class="verification-btn" id="delete-page-btn" @click="deletePage">Удалить страницу</button>                    
                </b-overlay>
                <button class="verification-btn" @click="changeVerificationStatus(true)">Верифицировать</button>
                <button class="verification-btn" @click="changeVerificationStatus(false)">Отменить верификацию</button>
            </div>
            <div class="save-btn-content">
                <b-overlay :show="isSavingChangesProcess" rounded="sm">
                    <button class="verification-btn" @click="saveChanges" id="save-changes-btn">
                        Сохранить изменения
                    </button>
                </b-overlay>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import * as Types from '@/types/Types';
import { base } from "../../../base/base";

const apiUrl = base.params.server + ':' + base.params.port;

interface IData {
    verificationStatus: boolean,
    item: Types.IProdDocumentData | null,
    isSavingChangesProcess: boolean,
    isSavingDeleteProcess: boolean,
    solProductId: string
}

export default Vue.extend({
    props: {
        propItem: Object
    },
    data() {
        var dt: IData = {
            verificationStatus: this.propItem.document.prodDocumentStatus === 2 ? true : false,
            item: null,
            isSavingDeleteProcess: false,
            isSavingChangesProcess: false,
            solProductId: this.propItem.solProductId
        }
        return dt;
    },
    created() {
        this.item = this.propItem.document ? this.propItem.document as Types.IProdDocumentData : null;
    },
    methods: {
        confluenceLink() {
            return `<a href="${this.item?.prodDocumentUrl}"  target="_blank" rel="noreferrer">${normalizeDocType(this.item?.prodDocumentType)}</a>`
        },
        changeVerificationStatus(verification: boolean) {
            this.verificationStatus = verification;
        },
        deletePage() {
            if (this.item && this.item.prodDocumentUrl) {
                this.isSavingDeleteProcess = true;
                const splitedUrl = this.item?.prodDocumentUrl.split('=');
                const pageId = splitedUrl[splitedUrl.length - 1];
                const data = {
                    pageId: pageId,
                    documentType: this.item.prodDocumentType
                }

                const requestOptions = {
                    method: 'POST',
                    body: JSON.stringify(data),
                    headers: { 'Content-Type': 'application/json' }
                };

                fetch(`${apiUrl}/deleteConfluencePage`, requestOptions)
                    .then(res => res.json())
                    .then(
                        (result) => {
                            this.isSavingDeleteProcess = false;
                            if (result.success) {
                                this.changeBtnDisplay('delete-page-btn', true);
                            } else {
                                console.log(result);
                                this.changeBtnDisplay('delete-page-btn', false);
                            }
                        },
                        (error) => {
                            this.isSavingDeleteProcess = false;
                            console.log(error);
                            this.changeBtnDisplay('delete-page-btn', false);
                        }
                    );
            } else {
                alert('Ошибка - отсутствует связанная страница в Confluence')
            }
        },
        saveChanges() {
            if (this.item && this.item.prodDocumentUrl) {
                this.isSavingChangesProcess = true;
                const splitedUrl = this.item?.prodDocumentUrl.split('=');
                const pageId = splitedUrl[splitedUrl.length - 1];
                const data = {
                    pageId: pageId,
                    pageTitle: this.solProductId,
                    documentType: this.item.prodDocumentType,
                    verification: this.verificationStatus
                }

                const requestOptions = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                };

                fetch(`${apiUrl}/changeVerification`, requestOptions)
                    .then(res => res.json())
                    .then(
                        (result) => {
                            this.isSavingChangesProcess = false;
                            if (result.success) {
                                this.changeBtnDisplay('save-changes-btn',true);
                            } else {
                                console.log(result);
                                this.changeBtnDisplay('save-changes-btn',false);
                            }
                        },
                        (error) => {
                            this.isSavingChangesProcess = false;
                            console.log(error);
                            this.changeBtnDisplay('save-changes-btn',false);
                        }
                    );
            } else {
                alert('Ошибка - отсутствует связанная страница в Confluence')
            }
        }, 
        changeBtnDisplay(id:string, status: boolean) {
            const btn = document.getElementById(id);
            if(btn){
                const prevVal = btn.innerHTML;
                const className = status ? 'success' : 'unsuccess';
                btn.innerHTML = status ? 'Успешно' : 'Ошибка при выполнении';
                btn.classList.add(`${className}-border`);

                setTimeout(() => {
                    btn.classList.remove(`${className}-border`);
                    btn.innerHTML = prevVal;
                }, 3000);
            }
        }
    }

})

function normalizeDocType(docType?: string): string {
    if (docType) {
        switch (docType) {
            case 'roadMap':
                return 'Маршрутная карта'
            case 'DRP':
                return 'DRP';
            case 'HLD':
                return 'HLD схема'
        }
    }
    return 'Uncorrect type'

}
</script>