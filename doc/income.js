/**
 *  Vyse prijmu v zavislosti na vstupnim kapitalu
 */

var vydaje = 500 + 1000 + 1100 + 1000;
var zhodnoceni = 43;
var dane = 15;
var kurz = 26;
var komise = 1;
var kapitalNasobky = 10000;

for(var i = 1; i <= 10; i++ ) {
	var kapital = kapitalNasobky * i;

	var pa = kapital * (zhodnoceni / 100);
	var zdanenePa = pa * (1 - (15 / 100));
	var obchoduRocne = 160;
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
