/**
 *  Vyse prijmu v zavislosti na vstupnim kapitalu
 */

var vydaje = 100; // server +
var zhodnoceni = 43;
var poplatky = 30;		// dane + zdravotni + socialni (pausalni daneni)
var kurz = 24.4;
var komise = 1;
var kapitalNasobky = 10000;
var max = 5;
var obchoduRocne = 400;

for(var i = 1; i <= 5; i++ ) {
	var kapital = kapitalNasobky * i;

	var pa = kapital * (zhodnoceni / 100);
	var zdanenePa = pa * (1 - (poplatky / 100));
	var poplatkyRocne = obchoduRocne * 2 * komise;

	var cistyZisk = zdanenePa - vydaje - poplatkyRocne;
	var cistyZiskCZK = parseFloat(cistyZisk * kurz, 2);
	var cistyMesicniZiskCZK = parseFloat(cistyZiskCZK / 12, 2);

	console.log();
	console.log("================ "+kapital+" ===============");
	console.log("Kapital: ", kapital);
	console.log("Kapital CZK: ", kapital * kurz);
	console.log("Fixni Vydaje: ", vydaje);
	console.log("PA: ", pa);
	console.log("ZdanenePa: ", zdanenePa);
	console.log("Poplatky Rocne: ", poplatkyRocne);
	console.log("Cisty zisk: ", cistyZisk);
	console.log("Cisty zisk CZK: ", cistyZiskCZK);
	console.log("Cisty mesicni zisk CZK: ", cistyMesicniZiskCZK);
	console.log("======================================");
}
