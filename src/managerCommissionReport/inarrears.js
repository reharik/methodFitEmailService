/*
 * File: /src/managerCommissionReport/inarrears.js
 * Project: lambdaemails
 * Created Date: 2020-11-14
 * Author: Raif
 *
 */

const root = `
<table style="border:1px solid black; padding:3px; width: 100%;">

`;

const buildRow = (row) => `<tr>
        <td style="border-bottom:1px solid black">
            ${row.client}</td>
		<td style="border-bottom:1px solid black">
            ${row.type}</td>
		<td style="border-bottom:1px solid black">
			${row.date}</td>
	</tr>
`;

const build = (trainer) => {
	let html = `<tr>
        <td colspan="3" style="font-weight:bold;border-bottom:1px solid black">
            ${trainer[0].trainer}
        </td>
    </tr>
    <tr style="font-weight:bold;" >
    <td style="border-bottom:1px solid black">Client</td>
    <td style="border-bottom:1px solid black">Type</td>
    <td style="border-bottom:1px solid black">Date</td>
</tr>`;
	trainer.forEach((x) => (html += buildRow(x)));
	return html;
};

const inarrears = (data) => {
	let html = root;
	Object.keys(data).forEach((x) => (html += build(data[x])));
	html += `</table>`;

	return html;
};

module.exports = inarrears;
