<script setup lang="ts">
import {ref} from "vue";

// const {t} = useI18n()
const t = (key: string) => key
const props = defineProps({
  data: {type: Object, required: false, default: () => ({})},
  kind: {type: String, required: false, default: 'pre_invoice'},
  rounded: {type: String, required: false, default: 'lg'},
  color: {type: String, required: false, default: 'blue'},
  custom: {type: Object, required: false, default: () => ({})},
});

const dateString = ref("jYYYY/jMM/jDD")

function isValidLink(url: any) {
  if (url) {
    return url.startsWith('http://') || url.startsWith('https://')
  }
  return false
}

function printInvoice() {
  const WindowPrt = window.open(
      '',
      '',
      'fullscreen=yes,toolbar=0,scrollbars=yes,status=0,width=' + screen.availWidth + ',height=' + screen.availHeight)

  let printContent = `
  <html>
    <head>
      <title>${props.data.status === 7 ? 'فاکتور لغو شده' : [9, 10, 11, 12].includes(props.data.status) ? 'فاکتور مرجوعی' : props.data.kind_text === 'pre_invoice' ? props.custom['Invoices-Order-Header-Center'] : props.custom['Invoices-Header-Center']}</title>
        <meta charset="UTF-8">
        <meta id="vp" name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          direction: rtl;
          font-size:8pt;
        }
        html, body {
            padding: 0;
            margin: 0 auto;
            max-width: 29.7cm;
            -webkit-print-color-adjust: exact;
        }

        body {
            padding: 0.5cm
        }

        * {
            box-sizing: border-box;
            -moz-box-sizing: border-box;
        }

        table {
            width: 100%;
            table-layout: fixed;
            border-spacing: 0;
        }

        .header-table {
            table-layout: fixed;
            border-spacing: 0;
        }

        .header-table td {
            padding: 0;
            vertical-align: top;
        }

        body {
            direction: rtl;
        }

        .print-button {
            cursor: pointer;
            -webkit-box-shadow: none;
            box-shadow: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            display: -webkit-inline-box;
            display: -ms-inline-flexbox;
            display: inline-flex;
            -webkit-box-align: center;
            -ms-flex-align: center;
            align-items: center;
            -webkit-box-pack: center;
            -ms-flex-pack: center;
            justify-content: center;
            border-radius: 5px;
            background: none;
            -webkit-transition: all .3s ease-in-out;
            transition: all .3s ease-in-out;
            position: relative;

            outline: none;
            text-align: center;

            padding: 8px 16px;
            font-size: 12px;
            font-size: .857rem;
            line-height: 1.833;
            font-weight: 700;
            background-color: #0fabc6;
            color: #fff;
            border: 1px solid #0fabc6;
        }

        .page {
            background: white;
            page-break-after: always;
        }

        .flex {
            display: flex;
        }

        .flex > * {
            float: left;
        }

        .flex-grow {
            flex-grow: 10000000;
        }

        .barcode {
            text-align: center;
            margin: 12px 0 0 0;
            height: 30px;
        }

        .barcode span {
            font-size: 35pt;
            font-family: 'Libre Barcode 128';
        }

        .portait {
            transform: rotate(-90deg) translate(0, 40%);
            text-align: center;
        }

        .header-item-wrapper {
            border: 1px solid #000;
            width: 100%;
            height: 100%;
            background: #eee;
            display: flex;
            align-content: center;
        }

        thead, tfoot {
            background: #eee;
        }

        .header-item-data {
            height: 100%;
            width: 100%;
        }

        .bordered {
            border: 1px solid #000;
            padding: 0.12cm;
        }

        .header-table table {
            width: 100%;
            vertical-align: middle;
        }

        .content-table {
            border-collapse: collapse;
        }

        .content-table td, th {
            border: 1px solid #000;
            text-align: center;
            padding: 0.1cm;
            font-weight: normal;
        }

        table.centered td {
            vertical-align: middle;
        }

        .serials {
            direction: ltr;
            text-align: left;
        }

        .title {
            text-align: right;
        }

        .grow {
            width: 100%;
            height: 100%;
        }

        .font-small {
            font-size: 8pt;
        }

        .font-medium {
            font-size: 10pt;
        }

        .font-big {
            font-size: 15pt;
        }

        .label {
            font-weight: bold;
            padding: 0 0 0 2px;
        }

        @page {
            size: A4 landscape;
            margin: 0;
            margin-bottom: 0.5cm;
            margin-top: 0.5cm;
        }

        .ltr {
            direction: ltr;
            display: block;
        }

        .description {
          color: #656565;
          font-size: 8pt;
          margin-top: 0.1cm;
          text-align: right;
          line-height: 1.25rem;
          padding: 0 !important;
        }

        @media print {
            .print-button {
                display: none;
                visibility: hidden;
            }
        }

        .signature-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0.5cm;
          padding-bottom: 0.5cm;
        }

        .signature-item {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          flex: 1 1 50%;
          text-align: center;
          height: 60px;
        }

        .signature-img, .buyer-signature {
          width: 60px;
          height: 60px;
          object-fit: fill;
          display: flex;
          justify-content: center;
          align-items: center;
          border: none;
          box-shadow: none;
        }

        .signature-label {
          font-size: 12px;
          font-weight: normal;
          color: #495057;
          margin: 0;
        }

        .addr-cell{
          direction: rtl;
           width: 90%;
          text-align: right;
        }

        .addr-cell .label{
          display: inline-block;
          vertical-align: top;
        }

        .addr-cell .value{
          display: inline;
          white-space: normal;
        }

        .top-align-row td{
        padding-top: 0.75cm !important;
          vertical-align: top !important;
        }

      </style>
    </head>
    <body>
      <div class="bg-neutral-100 pt-1 overflow-auto hide-scrollbar">
        <div class="bg-neutral-000 p-5 lg:px-0 orderInvoce_orderInvoice__vC2nB">
            <div>
                <div class="page">
                <table class="header-table" style="width: 100%">
                    <tbody>
                        <tr>
                        <td style="width: 20%;">
                              <div>${props.custom['Invoices-Header-Right']}</div>
                          </td>
                          <td style="width: 60%;">
                              <h1 style="text-align: center;font-size: 20px">${props.data.status === 7 ? 'فاکتور لغو شده' : [9, 10, 11, 12].includes(props.data.status) ? 'فاکتور مرجوعی' : props.data.kind_text === 'pre_invoice' ? props.custom['Invoices-Order-Header-Center'] : props.custom['Invoices-Header-Center']}</h1>
                          </td>
                          <td  style="width: 20%;text-align: left">
                          ${isValidLink(props.custom['Invoices-Header-Left'])
      ? `<img src="${props.custom['Invoices-Header-Left']}" style="max-height: 40px;max-width: 100%;margin-bottom: 0.1cm"/>`
      : `<div>${props.custom['Invoices-Header-Left']}</div>`
  }
                          </td>
                        </tr>
                    </tbody>
                  </table>
                <table class="header-table" style="width: 100%">
                    <tbody>
                        <tr>
                        <td style="width: 1.8cm; height: 2.5cm;vertical-align: middle;padding-bottom: 4px;">
                            <div class="header-item-wrapper">
                               <div class="portait" style="margin:20px">فروشنده</div>
                           </div>
                        </td>
                        <td style="padding: 0 4px 4px;height: 2cm;">
                            <div class="bordered grow header-item-data">
                               <table class="grow centered">
                                  <tbody>
                                  <tr>
                                      <td style="width: 6cm">
                                          <span class="label">فروشنده :</span>${props.custom['Invoices-Company-Name']}
                                      </td>
                                      <td>
                                          <span class="label">شناسه ملی :</span>${props.custom['Invoices-Company-National-Code']}
                                      </td>
                                      <td>
                                          <span class="label">شماره ثبت :</span>${props.custom['Invoices-Company-Register-Code']}
                                      </td>
                                      <td>
                                          <span class="label">شماره اقتصادی :</span>${props.custom['Invoices-Company-Economic-Code']}
                                      </td>
                                  </tr>
                                  <tr class="top-align-row">
                                        <td colspan="2" class="addr-cell">
                                          <span class="label">نشانی شرکت :</span>
                                          <span class="value">${props.custom['Invoices-Company-Address']}</span>
                                        </td>
                                        <td>
                                          <span class="label">کدپستی :</span>${props.custom['Invoices-Company-Postal-Code']}
                                        </td>
                                        <td>
                                          <span class="label">تلفن و فکس :</span>${props.custom['Invoices-Company-Telephone']}
                                        </td>
                                  </tr>
                                </tbody>
                              </table>
            </div>
        </td>
                    <td style="width: 7cm; height: 2cm; padding: 0 4px 4px 0;">
                <div class="bordered flex-column justify-space-between" style="text-align: center;justify-content: center; height: 100%;">
                    <div class="flex">
                        <div class="font-small label">شماره فاکتور :</div>
                        <div class="flex-grow" style="text-align: left">${props.kind === 'pre_invoice' ? props.data.id : props.data.invoice_number}</div>
                    </div>
                    <div class="flex">
                        <div class="font-small label" style="margin-top: 0.75cm">تاریخ :</div>
                        <div class="flex-grow" style="text-align: left;margin-top: 0.6cm">${usePersianDate(props.data.created_at).toString(dateString.value)}</div>
                    </div>
                </div>
            </td>
            </tr>
    <tr>
        <td style="width: 1.8cm; height: 3cm;vertical-align: middle;padding-bottom: 4px;">
            <div class="header-item-wrapper">
                <div class="portait" style="margin: 20px">خریدار</div>
            </div>
        </td>
        <td colspan="2" style="height: 3cm;vertical-align: center; padding: 0 4px 4px 0">
            <div class="bordered header-item-data">
                <table style="height: 100%" class="centered">
    <tbody>
    <tr>
        <td style="width: 6cm">
            <span class="label">خریدار :</span>${props.data.user_full_name}
        </td>
        <td>
            <span class="label">شماره‌اقتصادی / ‌ملی :</span> ${props.data.economic_number ?? '--'}
        </td>
        <td>
            <span class="label">شناسه ملی :</span>
            ${props.data.user_gender === 2
      ? (props.data.national_number ?? '--')
      : (props.data.user_national_code ?? '--')}
        </td>
        <td>
            <span class="label">شماره ثبت :</span>${props.data.register_number ?? '--'}
        </td>
    </tr>
    <tr>
        <td colspan="2">
            <span class="label">نشانی :</span>${props.data.receiver_address ?? '--'}
        </td>
        <td>
            <span class="label">کد پستی :</span>${props.data.receiver_postal_code ?? '--'}
        </td>
        <td>
            <span class="label">شماره تماس :</span> 0${props.data.user_mobile ?? '--'}
        </td>
    </tr>`
  if (props.data.send_date && props.data.send_time) {
    printContent = printContent + `
<tr>
        <td>
            <span class="label">تاریخ ارسال :</span>${props.data.send_date ? usePersianDate(props.data.send_date) : '--'}
        </td>
        <td>
            <span class="label">ساعت ارسال :</span>${props.data.send_time ?? '--'}
        </td>
    </tr>`
  }
  printContent = printContent + `
  <tr>
        <td colspan="4">
            <span class="label">توضیحات :</span>
          ${props.data.description && props.data.description !== '' ? props.data.description : '--'}
        </td>
    </tr>
  `
  printContent = printContent + `
</tbody>
</table>
            </div>
        </td>
            </tr>
</tbody>
</table>
    <table class="content-table">
        <thead>
        <tr>
                <th style="text-align: center;">ردیف</th>
    <th style="width: 2.3cm;text-align: center;">شناسه کالا یا خدمت</th>
    <th style="width: 30%;text-align: center;">شرح کالا یا خدمت</th>
    <th style="text-align: center;">${[9, 10, 11, 12].includes(props.data.status) ? 'تعداد مرجوعی' : 'تعداد'}</th>
    <th style="width: 2.3cm;text-align: center">مبلغ واحد (ریال)</th>
    <th style="width: 2.3cm;text-align: center">تخفیف (ریال)</th>
    <th style="width: 2.3cm;text-align: center">مبلغ کل (ریال)</th>
    <th style="width: 2.3cm;text-align: center">مبلغ کل پس از تخفیف (ریال)</th>
    <th style="width: 2.3cm;text-align: center"> جمع مالیات و عوارض ارزش افزوده (ریال)</th>
    <th style="width: 2.5cm;text-align: center"> جمع کل پس از تخفیف و مالیات و عوارض (ریال)</th>
        </tr>
        </thead>
        <tbody>`;

  let totalAmount = 0
  let totalUnitPrice = 0
  let countRow = 0
  props.data.invoice_details.forEach(function (value) {
    totalAmount += value.amount
    totalUnitPrice += value.unit_price
    countRow++
    printContent = printContent + `
    <tr>
      <td>${countRow}</td>`
    if (value.products.other_code) {
      printContent = printContent + `
      <td>${value.products.other_code}</td>`
    } else {
      printContent = printContent + `
      <td>${value.products.id}</td>`
    }
    printContent = printContent + `
       <td>
    <div class="title">
    ${value.price_kind === 0 ? 'خرید' : value.price_kind === 1 ? 'تمدید' : 'تجدید'}
    ${value.products.type_code === 1 ? 'محصول' : value.products.type_code === 2 ? 'خدمات' : value.products.type_code === 3 ? 'کارت' : 'دوره'}
${value.products.title_fa}
</div>`
    if (value.description && value.description !== '') {
      printContent = printContent + `
        <div class="description">
      ${props.data.status_text.includes('return')
          ? 'علت مرجوعی : ' + (value.return_reason_title ? value.return_reason_title + ' - ' + value.description : value.description)
          : value.description}
    </div>`
    }
    printContent = printContent + `
  </td>
      <td><span class="ltr">${value.amount}</span></td>
      <td><span class="ltr">${numberWithSeparatorToman(value.unit_price ?? 0)}</span></td>
      <td><span class="ltr">${numberWithSeparatorToman(value.discount_price ?? 0)}</span></td>
      <td><span class="ltr">${numberWithSeparatorToman((value.amount ?? 0) * (value.unit_price ?? 0))}</span></td>
      <td><span class="ltr">${numberWithSeparatorToman((value.amount ?? 0) * (value.unit_price ?? 0) - (value.discount_price ?? 0))}</span></td>
      <td><span class="ltr">${numberWithSeparatorToman(value.tax_price ?? 0)}</span></td>
      <td><span class="ltr">${numberWithSeparatorToman(value.total_price ?? 0)}</span></td>
   </tr>`
    if (value.dynamic_column_01) {
      const parsedData = JSON.parse(value.dynamic_column_01);
      printContent = printContent + `
    <tr>
      <td></td>
      <td>-</td>
      <td style="text-align: start;">
        کارت
        ${parsedData.product_id} -
        ${parsedData.product_title}
      </td>
      <td colspan="7" style="text-align: start;line-height: 2rem">
  `;
      Object.entries(parsedData.attibs).forEach(([key, item], index) => {
        printContent = printContent + `
      <span style="display: inline-block;">
        ${item.title}: ${item.reslt}
      </span>
    `;
        if (index < Object.entries(parsedData.attibs).length - 1) {
          printContent = printContent + `
        <span>---</span>
      `;
        }
      });
      printContent = printContent + `</td></tr>`;
    }
  })
  printContent = printContent + `
  <tr>
    <td colspan="3"><b>جمع کل</b></td>
    <td>---</td>
    <td>---</td>
    <td><b class="ltr">${numberWithSeparatorToman(props.data.discount_price ?? 0)}</b></td>
    <td><b class="ltr">${numberWithSeparatorToman(props.data.impure_price ?? 0)}</b></td>
    <td><b class="ltr">${numberWithSeparatorToman(props.data.impure_price - props.data.discount_price)}</b></td>
    <td><b class="ltr">${numberWithSeparatorToman(props.data.tax_price ?? 0)}</b></td>
    <td><b class="ltr">
      ${numberWithSeparatorToman(
      props.data.total_price + (props.data.other_price - (Number(props.data.send_price) || 0)) || 0
  )}
    </b></td>
  </tr>
  ${Number(props?.data?.other_price) > 0 ? `
    <tr>
      <td colspan="5"></td>
      <td colspan="4" class="font-small">
        <b>تخفیف مازاد</b>
      </td>
      <td><span class="ltr" id="otherPriceValue">
        <b>${numberWithSeparatorToman(Number(props.data.other_price))}</b>
      </span></td>
    </tr>
  ` : ''}
  <tr>
    <td colspan="5"></td>
    <td colspan="4" class="font-small">
      <b>${[9, 10, 11, 12].includes(props.data.status) ? 'مبلغ کل قابل استرداد (ریال)' : 'جمع کل پس از کسر تخفیف با احتساب مالیات و عوارض (ریال)'}</b>
    </td>
    <td><b><span class="ltr">${numberWithSeparatorToman(props.data.total_price ?? 0)}</span></b></td>
  </tr>
  <tr style="background: #fff">
    <td colspan="10" style="vertical-align: top;">
      <div class="signature-container">
  <div class="signature-item">
  <div>
      ${isValidLink(props.custom['Invoices-Footer-Right'])
      ? `<img src="${props.custom['Invoices-Footer-Right']}" class="signature-img" />`
      : `<div class="buyer-signature"></div>`
  }
  </div>
  <div class="signature-text">
  <p class="signature-label">مهر و امضای فروشنده</p>
  </div>
  </div>

  <div class="signature-item">
  <div>
  <div class="buyer-signature"></div>
      </div>
      <div class="signature-text">
  <p class="signature-label">مهر و امضای خریدار</p>
  </div>
  </div>
  </div>
    </td>
  </tr>
</tfoot>
</table>
<div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px; margin-left: 5px;">
<div>${props.custom['Invoices-Footer-Center']}</div>
  <div>${props.custom['Invoices-Footer-Left']}</div>
</div>
</div></div></div></div></body></html>`;

  WindowPrt.document.write(printContent)
  const head = WindowPrt.document.getElementsByTagName('head')[0]
  let fontLink = WindowPrt.document.createElement('link')
  fontLink.setAttribute('rel', 'stylesheet')
  fontLink.setAttribute('type', 'text/css')
  head.appendChild(fontLink)
  setTimeout(() => {
    WindowPrt.document.close();
    WindowPrt.focus();
    WindowPrt.print();
    WindowPrt.close();
  }, 3000)
}

function numberWithSeparatorToman(x: any) {
  if (props.data.currency_symbol === 'IRT') {
    x = x * 10
  }
  if (x === null || x === undefined || x === '') return '';
  const num = Number(x.toString().replace(/,/g, ''));
  if (isNaN(num)) return '';

  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}
</script>

<template>
  <button
    type="button"
    @click="printInvoice"
    class="inline-flex items-center justify-center px-4 py-2 font-medium transition-all duration-200
           bg-blue-500/10 text-blue-500 border border-blue-500/20
           hover:bg-blue-500 hover:text-white"
    :class="{
      'rounded-none': rounded === '0',
      'rounded-sm': rounded === 'sm',
      'rounded-md': rounded === 'md',
      'rounded-lg': rounded === 'lg',
      'rounded-xl': rounded === 'xl',
      'rounded-full': rounded === 'pill'
    }"
  >
    {{ t("print") }}
  </button>
</template>