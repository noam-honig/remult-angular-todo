import { Injectable } from '@angular/core';
import { NbaPlayerInfoDb } from 'src/shared/dbTasks/NbaPlayerInfoDb';
import { SportsNameToId } from '../sports-name-to-id';
import { DbNbaGameStats } from 'src/shared/dbTasks/DbNbaGameStats';
import { NbaController } from 'src/shared/Controllers/NbaController';

@Injectable()
export class nbaApiController {
  arrayOfNBATeams: SportsNameToId = { Atlanta_Hawks: 1, Boston_Celtics: 2, Brooklyn_Nets: 4, Charlotte_Hornets: 5, Chicago_Bulls: 6, Cleveland_Cavaliers: 7, Dallas_Mavericks: 8, Denver_Nuggets: 9, Detroit_Pistons: 10, Golden_State_Warriors: 11, Houston_Rockets: 14, Indiana_Pacers: 15, Los_Angeles_Clippers: 16, Los_Angeles_Lakers: 17, Memphis_Grizzlies: 19, Miami_Heat: 20, Milwaukee_Bucks: 21, Minnesota_Timberwolves: 22, New_Orleans_Pelicans: 23, New_York_Knicks: 24, Oklahoma_City_Thunder: 25, Orlando_Magic: 26, Philadelphia_76ers: 27, Phoenix_Suns: 28, Portland_Trail_Blazers: 29, Sacramento_Kings: 30, San_Antonio_Spurs: 31, Toronto_Raptors: 38, Utah_Jazz: 40, Washington_Wizards: 41 }
  nbaPlayerStatData: DbNbaGameStats[] = []
  playerStatData: any[] = []

  async getNbaPlayerDataFromApi(games: string): Promise<NbaPlayerInfoDb[]> {
    var gameArray = this.splitGameString(games)
    var temp: NbaPlayerInfoDb[] = []
    for (let i = 0; i < gameArray.length; i++) {
      let teamId = this.arrayOfNBATeams[this.addUnderScoreToName(gameArray[i])]
      const url = `https://api-nba-v1.p.rapidapi.com/players?team=${teamId}&season=2023`;
      const options = {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': 'b66301c5cdmsh89a2ce517c0ca87p1fe140jsne708007ee552',
          'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
        }
      };

      try {
        const response = await fetch(url, options);
        const result = await response.json();
        const processedResult = result.response

        processedResult.forEach((e: any) => {
          if (e.firstname.includes("Jr.")) {
            e.firstname = e.firstname.replace("Jr.", "")
            e.firstname = e.firstname.trim()
            e.lastname += " Jr"
          }

          if (e.firstname.includes("II")) {
            e.firstname = e.firstname.replace("II", "")
            e.firstname = e.firstname.trim()
            e.lastname += " II"
          }
          if (e.firstname.includes("III")) {
            e.firstname = e.firstname.replace("III", "")
            e.firstname = e.firstname.trim()
            e.lastname += " III"
          }
          if (e.firstname.includes("IV")) {
            e.firstname = e.firstname.replace("IV", "")
            e.firstname = e.firstname.trim()
            e.lastname += " IV"
          }
          console.log(e.firstname)
          console.log(e.lastname)
          if(e.lastname.toLowerCase() == "claxton" && e.firstname.toLowerCase() == "nic"){
            e.firstname = "Nicolas"
          }
          var playerName = e.firstname + " " + e.lastname
          if (playerName.includes(".")) {
            playerName = playerName.replaceAll(".", "")
          }
          

          temp.push({
            playerId: e.id,
            playerName: playerName,
            teamId: teamId
          })
        })

      } catch (error) {
        console.error(error);
      }
    }
    return temp;


  }



  async loadNba2022PlayerStatData(id: number) {
    const url = `https://api-nba-v1.p.rapidapi.com/players/statistics?id=${id}&season=2022`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'b66301c5cdmsh89a2ce517c0ca87p1fe140jsne708007ee552',
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      }
    };
    const promise = await fetch(url, options);
    const processedResponse = await promise.json();
    this.playerStatData = processedResponse.response;
    await this.convertNbaStatDataToInterface(id, 2022).then(items => this.nbaPlayerStatData = items);
    return this.nbaPlayerStatData;
  }
  async loadNba2023PlayerStatData(id: number) {
    const url = `https://api-nba-v1.p.rapidapi.com/players/statistics?id=${id}&season=2023`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'b66301c5cdmsh89a2ce517c0ca87p1fe140jsne708007ee552',
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      }
    };
    const promise = await fetch(url, options);
    const processedResponse = await promise.json();
    this.playerStatData = processedResponse.response;
    this.nbaPlayerStatData = await this.convertNbaStatDataToInterface(id, 2023)
    return this.nbaPlayerStatData;
  }

  async convertNbaStatDataToInterface(id: number, season: number) {
    var temp: DbNbaGameStats[] = []
    var player = await NbaController.nbaLoadPlayerInfoFromId(id)
    for (let i = 0; i < this.playerStatData.length; i++) {
      if (this.playerStatData[i].game.id >= 12478 && this.playerStatData[i].game.id <= 12548) {
        continue
      }
      var game = await this.loadGameFromId(this.playerStatData[i].game.id)
      temp.push({
        playerId: this.playerStatData[i].player.id,
        playerName: this.playerStatData[i].player.firstname + " " + this.playerStatData[i].player.lastname,
        teamName: this.playerStatData[i].team.name,
        teamId: this.playerStatData[i].team.id,
        teamAgainstName: this.arrayOfNBATeams[this.addUnderScoreToName(game.teams.visitors.name)] == this.playerStatData[i].team.id ? game.teams.home.name : game.teams.visitors.name,
        teamAgainstId: this.arrayOfNBATeams[this.addUnderScoreToName(game.teams.visitors.name)] == this.playerStatData[i].team.id ? game.teams.home.id : game.teams.visitors.id,
        homeOrAway: this.arrayOfNBATeams[this.addUnderScoreToName(game.teams.visitors.name)] == this.playerStatData[i].team.id ? "Away" : "Home",
        season: season,
        gameId: this.playerStatData[i].game.id,
        gameDate: this.convertDate(game.date.start),
        playerStarted: this.playerStatData[i].min != "00:00" ? "Y" : "N",
        assists: this.playerStatData[i].assists,
        points: this.playerStatData[i].points,
        fgm: this.playerStatData[i].fgm,
        fga: this.playerStatData[i].fga,
        fgp: parseInt(this.playerStatData[i].fgp),
        ftm: this.playerStatData[i].ftm,
        fta: this.playerStatData[i].fta,
        ftp: parseInt(this.playerStatData[i].ftp),
        tpm: this.playerStatData[i].tpm,
        tpa: this.playerStatData[i].tpa,
        tpp: parseInt(this.playerStatData[i].tpp),
        offReb: this.playerStatData[i].offReb,
        defReb: this.playerStatData[i].defReb,
        totReb: this.playerStatData[i].totReb,
        pFouls: this.playerStatData[i].pFouls,
        steals: this.playerStatData[i].steals,
        turnover: this.playerStatData[i].turnovers,
        blocks: this.playerStatData[i].blocks,
        doubleDouble: this.isDoubleDouble(this.playerStatData[i]) == true ? 1 : 0,
        tripleDouble: this.isTripleDouble(this.playerStatData[i]) == true ? 1 : 0
      })

    }
    return temp
  }

  async loadGameFromId(id: number) {
    const url = `https://api-nba-v1.p.rapidapi.com/games?id=${id}`;
    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': 'b66301c5cdmsh89a2ce517c0ca87p1fe140jsne708007ee552',
        'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com'
      }
    };
    const response = await fetch(url, options);
    const result = await response.json();
    return result.response[0]

  }


  isDoubleDouble(statData: any): boolean {
    let count = 0;
    if (statData.assists >= 10) {
      count++
    }
    if (statData.points >= 10) {
      count++
    }
    if (statData.blocks >= 10) {
      count++
    }
    if (statData.steals >= 10) {
      count++
    }
    if (statData.totReb >= 10) {
      count++
    }
    if (count >= 2) {
      return true
    } else { return false }
  }

  isTripleDouble(statData: any): boolean {
    let count = 0;
    if (statData.assists >= 10) {
      count++
    }
    if (statData.points >= 10) {
      count++
    }
    if (statData.blocks >= 10) {
      count++
    }
    if (statData.steals >= 10) {
      count++
    }
    if (statData.rebounds >= 10) {
      count++
    }
    if (count >= 3) {
      return true
    } else { return false }
  }


  splitGameString(game: string): string[] {
    var bothGames: string[] = []
    var temp = ''
    var vsIndex = 0;
    vsIndex = game.indexOf("vs")
    bothGames.push(game.slice(0, vsIndex - 1))
    bothGames.push(game.slice(vsIndex + 3, game.length))
    return bothGames
  }

  addUnderScoreToName(game: string): string {
    game = game.replaceAll(" ", "_")
    return game;
  }

  convertDate(fullDate: string) {
    var tempDate = fullDate?.split("T");
    var time = tempDate[1].slice(0, 2)
    var subtractDay = false
    if(parseInt(time) - 6 <= 0){
      subtractDay = true
    }

    var indexOfFirstDash = tempDate[0].indexOf("-");
    var tempDate2 = tempDate[0].slice(indexOfFirstDash + 1, tempDate[0].length + 1);
    var finalDate = tempDate2.replace("-", "/");
    if(subtractDay){
      //finalDate = finalDate.replace(finalDate.charAt(finalDate.length-1) , (parseInt(finalDate.charAt(finalDate.length-1))-1).toString())
      var newDate = finalDate.split("/")
      newDate[1] = (parseInt(newDate[1]) - 1).toString()
      finalDate = newDate[0] + "/" + newDate[1]

    }
    
    return finalDate;
  }

}