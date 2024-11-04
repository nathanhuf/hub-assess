const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 3000;

function getNextDate(date) {
  const currentDate = new Date(date);
  const nextDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  const nextDateISO = nextDate.toISOString().split('T')[0];
  return nextDateISO;
}

function findBestEventDates(partners) {

    // Creating a map to store the available dates for each country
    const countryDatesMap = {};
    for (const partner of partners) {
      if (!countryDatesMap[partner.country]) {
        countryDatesMap[partner.country] = {};
      }
      for (const date of partner.availableDates) {
        if (!countryDatesMap[partner.country][date]) {
          countryDatesMap[partner.country][date] = 0;
        }
        const nextDate = getNextDate(date);
        if(partner.availableDates.includes(nextDate))
          countryDatesMap[partner.country][date]++;
      }
    }

    // Finding the best event date for each country
    const countries = [];
    for (const country in countryDatesMap) {
      const dates = Object.keys(countryDatesMap[country]);
      dates.sort();

      let maxCount = 0;
      let startDate = null;
      for (let i = 0; i < dates.length; i++) {
        const currentDate = dates[i];
        const currentCount = countryDatesMap[country][currentDate];
        if (currentCount > maxCount) {
          maxCount = currentCount;
          startDate = currentDate;
        }
      }

      const attendees = [];
      for (const partner of partners) {
        if (partner.country === country && partner.availableDates.includes(startDate) && partner.availableDates.includes(getNextDate(startDate))) {
          attendees.push(partner.email);
        }
      }

      countries.push({
        name: country,
        startDate: startDate,
        attendeeCount: attendees.length,
        attendees: attendees
      });
    }

    return countries;
}

app.get('/', (req, res) => {
  const url = 'https://candidate.hubteam.com/candidateTest/v3/problem/dataset';
  const userKey = '6880c19a978f9c128ebe9c239245';

  axios.get(`${url}?userKey=${userKey}`)
    .then(response => {
      const result = findBestEventDates(response.data.partners);
      axios.post('https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=6880c19a978f9c128ebe9c239245', {countries: result})
      .then(response => {
          res.json({ message: 'Successfully processed the data' });
      }).catch(error => {
        console.log(error.config);
        res.status(500).send("An error occurred");
      });
    })
    .catch(err => {
      console.error("Error", err);
      res.status(500).send("An error occurred");
    })
})

app.listen(PORT, () => {
  console.log(`Server started with port ${PORT}`);
});