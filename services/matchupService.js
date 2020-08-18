import pool from './db.js';
import yahooApiService from './yahooApiService.js';
import viewService from './viewService.js';
import seasonService from './seasonService.js';
import gamecodeService from './gameCodeService.js';
import seasonRosterPositionService from './seasonRosterPositionService.js';
import positionTypeService from './positionTypeService.js';

const importMatchups = async (req, res) => {
  const leagueCodes = await viewService.GetYahooLeagueCodes();
  const seasons = await seasonService.getExistingSeasons();
  const gamecodes = await gamecodeService.getAllGameCodes();
  let existingPositionTypes = await positionTypeService.GetPositionTypes();
  let existingSeasonRosterPositions = await seasonRosterPositionService.GetExistingSeasonRosterPositions();
  for (let l = 0; l < 1; l++) {
    const leagueCode = await leagueCodes.rows[l];
    const splitLeagueCode = leagueCode.leaguecode.split('.');
    const yahoogamecode = splitLeagueCode[0];
    const yahooleagueid = splitLeagueCode[2];
    const gamecodeFilter = gamecodes.rows.filter((value) => value.yahoogamecode === yahoogamecode);
    const gamecode = gamecodeFilter[0];
    const seasonFilter = await seasons.filter((value) => value.gamecodeid === Number(gamecode.gamecodeid) && value.yahooleagueid === Number(yahooleagueid));
    const season = seasonFilter[0];
    const leagueSettings = await yahooApiService.getLeagueSettings(req, res, leagueCode.leaguecode);

    if (leagueSettings.data.settings.trade_end_date && season.tradeenddate.length === 0) {
      // const date = new Date(leagueSettings.data.settings.trade_end_date);
      const query = `update season set tradeenddate = '${leagueSettings.data.settings.trade_end_date}' where seasonid = ${season.seasonid};`;
      const tradeUpdateResults = await pool.query(query);
    }

    if (leagueSettings.data.settings.playoffstartdate) {
      const playoffstartweek = await pool.query(`update season set playoffstartdate = ${leagueSettings.data.settings.playoffstartdate} where seasonid = ${season.seasonid}`);
    }

    const rosterpositions = leagueSettings.data.settings.roster_positions;
    console.log(rosterpositions.length);
    for (let r = 0; r < rosterpositions.length; r++) {
      const rosterposition = rosterpositions[r];
      let positionType;
      if (rosterposition.position_type) {
        let positionTypeFilter = await existingPositionTypes.rows.filter((value) => value.yahoopositiontype === rosterposition.position_type && value.gamecodetypeid === gamecode.gamecodetypeid);
        if (positionTypeFilter.length === 0) {
          const positiontypetoadd = {
            gamecodetypeid: gamecode.gamecodetypeid,
            yahoopositiontype: rosterposition.position_type
          };
          console.log('importing position type');
          await positionTypeService.InsertPositionType(positiontypetoadd);
          existingPositionTypes = await positionTypeService.GetPositionTypes();
          positionTypeFilter = await existingPositionTypes.rows.filter((value) => value.yahoopositiontype === rosterposition.position_type && value.gamecodetypeid === gamecode.gamecodetypeid);
        }

        positionType = positionTypeFilter[0];
      }

      let existingRosterPositionFilter = await existingSeasonRosterPositions.filter((value) => value.name === rosterposition.name && value.gamecodetypeid === gamecode.gamecodetypeid);
      if (existingRosterPositionFilter.length === 0) {
        const { gamecodetypeid } = gamecode;
        const name = rosterposition.position;
        const rosterPosition = [
          gamecodetypeid,
          name
        ];
        console.log(`inserting roster position ${name}`);
        const query = 'INSERT INTO rosterposition(gamecodetypeid, positionname) VALUES($1, $2)';
        const results = await pool.query(query, rosterPosition);
        existingSeasonRosterPositions = await seasonRosterPositionService.GetExistingSeasonRosterPositions();
        existingRosterPositionFilter = await existingSeasonRosterPositions.filter((value) => value.name === rosterposition.name && value.gamecodetypeid === gamecode.gamecodetypeid);
      }

      existingPosition = existingRosterPositionFilter[0];

      let existing

    }

    console.log(existingSeasonRosterPositions);
  }
};

export default {
  importMatchups
};
