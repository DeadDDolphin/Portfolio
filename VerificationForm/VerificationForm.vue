
<template>
  <b-overlay :show="showOverlay" rounded="sm">
    <div v-if="noData" class="product-card product-card__not-found">
      <h3>404 - Продукт не найден </h3>
    </div>
    <div v-else class="product-card">
      <div v-if="productData" class="product-card__header">
        <h5 class="product-card__title">
          <div v-html="getProducTypeLabel(getNormalizedDataType())" />
          <a :href="productLink()" target="_blank" class="product-card__header__link">{{getProductId()}} -
            {{productData.product_name}}</a>
        </h5>
        <div class="product-card__header__info">
          <b-progress max="100" variant="success">
            <b-progress-bar :value="productData.mcc_product_score"
              :label="productData.mcc_product_score > 5 ? `${productData.mcc_product_score}%`: ''"></b-progress-bar>
          </b-progress>
          <div v-html="getProducStatusLabel(productData.mcc_product_status_value)"></div>
        </div>
      </div>
      <div v-if="productData" class="product-verification__content">
        <div>

          <div className='content-product-info' v-html="newPortalLink()">
          </div>
          <b-tabs class="document-tabs" v-if="productData.documents.length > 0" content-class="mt-3">
            <b-tab v-for="item of productData.documents" v-bind:key="item.prodDocumentType"
              :title="item.prodDocumentType">
              <doc-tab-content :propItem="{solProductId: solProductId, document: item}"/>
            </b-tab>
          </b-tabs>
            <div v-else >
              У продукта отсутствуют прикрепленные документы
            </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script lang="ts">
import Vue from "vue";
import { base } from "../../base/base";
import * as Types from '../../types/Types';
import getItemLink from '@/components/functions/getItemLink';
import createSolProductId from '@/components/functions/createSolProductId';
import './VerificationForm.scss';
import DocTabContent from './components/DocTabContent.vue';
import newPortalLink from "../functions/newPortalLink";
const apiUrl = base.params.server + ':' + base.params.port;

/**
 * @param showOverlay показывать оверлей при загрузке данных
 * @param productId ID продукта, полученный из параметров запроса
 */
interface IData {
  showOverlay: boolean,
  productId: string,
  productData: Types.IProduct | Types.IItProduct | null,
  requiredQuestions: Types.IQuestion[],
  notRequiredQuestions: Types.IQuestion[],
  noData: boolean,
  solProductId: string | null
}

export default Vue.component(
  "VerificationForm", {
  props: {
    // 
  },
  components: {
    DocTabContent
  },
  data() {
    var dt: IData = {
      productId: '',
      showOverlay: false,
      productData: null,
      requiredQuestions: [],
      notRequiredQuestions: [],
      noData: false,
      solProductId: null
    }
    return dt;
  },
  async created() {
    this.productId = this.$route.params.id;
    await this.getProductData();
  },
  updated() {

  },
  methods: {
    updateData() {
      this.getProductData();
    },
    /**
     * Функция получения данных продукту
     */
    async getProductData(): Promise<void> {
      this.showOverlay = true;
      const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      };

      return await fetch(`${apiUrl}/getVerificationProductData/id=${this.productId}`, requestOptions)
        .then(res => res.json())
        .then(
          (result) => {
            if (result.success && result.data && result.data.rowCount > 0) {
              this.productData = result.data.rows[0];
              if(this.productData){
                this.solProductId = createSolProductId(this.productData.sol_id, this.productData.ppi_id as string, this.productData.data_type)
              }
            } else this.noData = true;
            this.showOverlay = false;
            return;
          },
          (error) => {
            console.log(error);
          }
        );
    },
    getNormalizedDataType() {
      if (this.productData) {
        switch (this.productData.data_type) {
          case 'ppi':
            return this.productData.product_type;
          case 'bp':
            if (this.productData.product_type === 'TechnoProduct') return 'Технопродукт';
            return 'Продукт SoL';
          case 'itp':
            return 'Продукт SoL';
          default: '';
        }
      }
    },
    getProductId() {
      const data = this.productData;
      if (data) {
        if (data.data_type === 'ppi') return data.ppi_id;
        return data.sol_code;
      }
    },
    getProducTypeLabel(productType) {
      switch (productType) {
        case 'Внешний':
          return `<span class="product-label ext-label">${productType}</span>`;
        case 'Внутренний':
          return `<span class="product-label int-label">${productType}</span>`;
        case 'Технопродукт':
          return `<span class="product-label tech-label">${productType}</span>`;
        case 'Продукт SoL':
          return `<span class="product-label sol-label">${productType}</span>`;
        default: '';
      }
    },
    getProducStatusLabel(status) {
      switch (status) {
        case 'Подключен':
          return `<span class="product-status-label connected-label">${status}</span>`;
        case 'Не подключен':
          return `<span class="product-status-label not-connected-label">${status}</span>`;
        case 'В работе':
          return `<span class="product-status-label in-progress-label">${status}</span>`;
        case 'Минимально подключен':
          return `<span class="product-status-label min-connected-label">${status}</span>`;
        default: '';
      }
    },
    keyGenerator(): number {
      return Math.floor(Math.random() * 100000000);
    },
    productLink() {
      if (this.productData) {
        return getItemLink(this.productData.data_type, this.productData.ppi_id ? this.productData.ppi_id : this.productData.sol_id);
      }
    },
    newPortalLink() {
      return newPortalLink(this.productData?.product_owner_login, this.productData?.product_owner_name);
    }
  }
}
);
</script>

