# prog-2052


## Handleliste
Fra handleliste siden kan du legge til og fjerne ting fra handlelisten til de ulike gruppene du er med på.
Hvis det er lagt til oppskrifter med ingredienser i kalenderen vil du kunne automatisk legge til alle ingrediensene i oppskriften ved å trykke på en knapp.
Du kan velge om du vil vise eller skjule de fullførte tingene på handlelisten.

## Oppskrifter
Fra oppskrifter siden kan man se alle oppskrifter man har laget. 
Hvis du la inn oppskrift med URL vil det være en lenke til oppskriften på nettsiden den ble hentet fra.
Bilde av oppskriftene vises også hvis det ble lagt til. 
Du kan filtrere oppskrifter basert på ulike kategorier og søke etter oppskrifter basert på navn.
Hvis du trykker på boksen med oppskriften vil du komme til en side hvor du kan se mer informasjon om oppskriften og endre på den.
Hvis du trykker på "Legg til oppskrift" knappen vil du komme til en side hvor du kan legge til en ny oppskrift.

## Oppskrift
På oppskrift siden kan du se mer informasjon om oppskriften og redigere oppskriften hvis du er eieren av oppskriften.

# Nettside endpoints:

## /
Hjemmeside

## /oppskrifter
Liste over alle oppskrifter

## /oppskrifter/oppskrift/{?id={:oppskrift_id}}
Visning av en spesifik oppskrift som kan endres på

## /kalender
Viser kalender for en uke

## /grupper
Viser info om gruppe med mulighet for å redigere for administratorer

## /handleliste
Mulighet til å se, legge til og fjerne ting fra handleliste



# API Endpoints:

## /recipe/

#### Hente oppskrift
```
 Method: GET
 Path: /recipe/{ID_til_bruker_eller_enkeltoppskrift}{?group={true}}{&single={true}}
```
Response:
```
200 - OK
Recipe
```
#### Legge til oppskrift
```
Method: POST
Path: /recipe/
Body:

``` 
Response:
```
201 - Created
id - ID for ny oppskrift
```

#### Fjerne oppskrift
```
Method: DELETE
Path: /recipe/
Body:

```

Response:
```
200 - OK
```

#### Endre oppskrift
```
Method: PATCH
Path: /recipe/
Body:

```

Response:

```
200 - OK
```


### /user/


### /group/


### /shopping/


### /image/
```
Method: POST
Path: /image/
Body: formfile "file"
```

Response:
```
200 - OK
id - ID (filnavn) til nytt bilde
```

# Deployment

For å deploye tjenesten bruker man et skript kalt deploy.sh. 
Det skriptet henter oppdateringer fra Git repoet og bygger en ny versjon av tjenesten ved hjelp av docker-compose.
Pass på at port 8080 og 433 er åpne på serveren, slik at tjenesten kan nås fra utsiden.