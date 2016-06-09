
// Prubeh strategie:
// - nacti config z persistentni vrstvy
// - spust scheduler na cca 4am
// - scheduler naplanuje spusteni strategie podle nastaveni v DB
// - pri spusteni strategie se preda rizeni strategii
// - strategie si dopredu stahne hist. data z vice zdroju
// 	 a aktualni stav nakoupenych pozic
// - v danem case si dotahne posledni data
// - spocita indikatory 
// - ulozi do DB
// - odesle na IB prikazy
// - ulozi do DB result volani IB api
// - odesle notifikaci

// ------------------------------------------
// ------------------------------------------

// pri vyskytu chyby se vyhodi event / exception
// ta se zachyti a odesle pres sms/email
// bude i nejaky check funkcnosti systemu pred hlavnim zpracovanim?
// jak bude probihat manualni uprava pozic?


