import * as chai from 'chai'
import { expect } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import chaiString from 'chai-string'
import fs from 'fs'
import { parseHTML } from 'linkedom'
import 'mocha'
import nock from 'nock'
import { getNewsletterHandler } from '../src'
import { generateUniqueUrl } from '../src/content-handler'
import { AxiosHandler } from '../src/newsletters/axios-handler'
import { BeehiivHandler } from '../src/newsletters/beehiiv-handler'
import { BloombergNewsletterHandler } from '../src/newsletters/bloomberg-newsletter-handler'
import { ConvertkitHandler } from '../src/newsletters/convertkit-handler'
import { CooperPressHandler } from '../src/newsletters/cooper-press-handler'
import { EnergyWorldHandler } from '../src/newsletters/energy-world'
import { EveryIoHandler } from '../src/newsletters/every-io-handler'
import { GenericHandler } from '../src/newsletters/generic-handler'
import { GhostHandler } from '../src/newsletters/ghost-handler'
import { GolangHandler } from '../src/newsletters/golang-handler'
import { HeyWorldHandler } from '../src/newsletters/hey-world-handler'
import { IndiaTimesHandler } from '../src/newsletters/india-times-handler'
import { MorningBrewHandler } from '../src/newsletters/morning-brew-handler'
import { SubstackHandler } from '../src/newsletters/substack-handler'

chai.use(chaiAsPromised)
chai.use(chaiString)

const load = (path: string): string => {
  return fs.readFileSync(path, 'utf8')
}

describe('Newsletter email test', () => {
  describe('#getNewsletterUrl()', () => {
    it('returns url when email is from SubStack', async () => {
      const headers = { 'list-post': '<https://hongbo130.substack.com/p/tldr>' }

      await expect(
        new SubstackHandler().parseNewsletterUrl(headers, '')
      ).to.eventually.equal('https://hongbo130.substack.com/p/tldr')
    })

    it('returns url when email is from Axios', async () => {
      const url = 'https://axios.com/blog/the-best-way-to-build-a-web-app'
      const html = `View in browser at <a>${url}</a>`

      await expect(
        new AxiosHandler().parseNewsletterUrl({}, html)
      ).to.eventually.equal(url)
    })

    it('returns url when email is from Bloomberg', async () => {
      const url = 'https://www.bloomberg.com/news/google-is-now-a-partner'
      const html = `
        <a class="view-in-browser__url" href="${url}">
        View in browser
        </a>
      `

      await expect(
        new BloombergNewsletterHandler().parseNewsletterUrl({}, html)
      ).to.eventually.equal(url)
    })

    it('returns url when email is from Golang Weekly', async () => {
      const url = 'https://www.golangweekly.com/first'
      const html = `
        <a href="${url}" style="text-decoration: none">Read on the Web</a>
      `

      await expect(
        new GolangHandler().parseNewsletterUrl({}, html)
      ).to.eventually.equal(url)
    })

    it('returns url when email is from Morning Brew', async () => {
      const url = 'https://www.morningbrew.com/daily/issues/first'
      const html = `
        <a style="color: #000000; text-decoration: none;" target="_blank" rel="noopener" href="${url}">View Online</a>
      `

      await expect(
        new MorningBrewHandler().parseNewsletterUrl({}, html)
      ).to.eventually.equal(url)
    })

    context('when email is from TTSO', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=P3-2FaBQ7M-2FNDUahrImPzjb5IJ1HxwpoWueibAnkVYsE7-2BEheb6ET732gFDDPaU3kbVi8SbYJ1qrmirIU-2Bv-2FXI7ATVIKLxbniavLprvKAI4D4MF3x-2BTrsmTPADymnqAAcraWiuQsupuWZBun933pm6WZqKUKSxVYJzstKQf99AKNWeVPVRJp6JB2iY2FYSMsK-2BuUvZxdKXxO6ulSVynglWjqVN-2BoymZZUGgPSZyaxhVOPaGh3Zm8XAjQ-2Bg-2Bj5lJv2d7V5T_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nxwv9liJXSvQhGKaieq5BGLFF1BYI-2FiEnfr1neeqi6jXSQvOWKGt9lxEPSLVP3ON5ZlNo-2FabdBl0c-2BV7Fivi1b3NGRcnoPsSyWZVXcYqCHaabltMz0-2Bw3U3rmfSIGPyDyyRcrmT81QUw6CrIx55zcwJlPbX7eL0Y2Gp9y7AymwAgw-3D-3D'
          )
          .reply(301, undefined, {
            Location: 'https://ttso.paris/2023-01-31',
          })
        nock('https://ttso.paris').head('/2023-01-31').reply(200, '')
      })

      it('returns url when email is from TTSO', async () => {
        const url = 'https://ttso.paris/2023-01-31'
        const html = load('./test/data/ttso-newsletter.html')

        await expect(
          new GenericHandler().parseNewsletterUrl({}, html)
        ).to.eventually.equal(url)
      })
    })

    context('when email is from Every.io', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=MnmHBiCwIPe9TmIJeskmAzMyFAOgfmWxTSMhUO2y3cX7SH8TU8fE7Bob959Q5SX8kPrOyAS87mVlVX7RClBX5O3kASzJW2uCz02hYzOF2YQ0jOrkqrBElBIkfeLl7ZERdDGVCD8VSijl4E0Tqgyrzl2vhAQyRsnJuYNo38k-2FROTfvWd85434dJ5Ajc284NO0JH4cM9g-2BdWlh0bID30oroznIHSP8Lg4qTxIVRNMq8zYyOtmR3fanZTexF5IrLPDqQMXmm0Wz0QK23ojkpC8yL3gexm2dDFZNOtKvgYlprJoR6QhevN9bulX1wI8ht5dtNccOAcexw3K4a3WMuoJp4thIKz0hIzOup38HTJPLtjRojXWKOyRBqE-2FdX17d4wY3lSqAN80IHqCic3WUBTenbU6Uo0Qi0FEVj0Iar7TuplOEENppNCZVJ5vpWMlMmQ8Wio7L_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nyAZZ0kujTWt86aLf2utm1bD-2FSj2DcbTCh3O3HD32SBIzeJdlXzKUs-2FRqjzbupd0J1Y8z5xnvQV5k1D5zyWOAHSxLv0Ezts-2FF2V2Y974g-2FABq5B151S2LbhNv8zTY6syz-2B1z-2BrGm8iNYGAPN1C9KbPpr0x08ptebSaNu86Stmdovg-3D-3D'
          )
          .reply(301, undefined, {
            Location:
              'https://every.to/divinations/the-endgame-for-ai-generated-writing',
          })
        nock('https://every.to/divinations')
          .head('/the-endgame-for-ai-generated-writing')
          .reply(200, '')
      })

      it('returns url when email is from Every.io', async () => {
        const url =
          'https://every.to/divinations/the-endgame-for-ai-generated-writing'
        const html = load('./test/data/every-io-newsletter.html')

        await expect(
          new EveryIoHandler().parseNewsletterUrl({}, html)
        ).to.eventually.equal(url)
      })
    })

    context('when email is from India Times', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=MnmHBiCwIPe9TmIJeskmA7k-2Fanl2A7JeTmz43mx4p6-2BbVKhpGtIfBa3Xxod6WoctYT6-2Fb-2Bpetp731F11WSOEvlcPaxSxNySmqMmLO-2FGO4lhOZ8XXhedQfJte-2Fg9Ewne7DNoRsb8wlAx1UfaFvu3zO5SbuXaneYjBP1ABV0l-2FgsuTKWa1VFEpWvU9c98b-2Bik7ghrWCOBmq7UH-2F1uQeI4CYGZyfZgdgPuxXS7wDDMtbcwK94jgZu9qNnmZxrZvlkd4-2Fa0S7JscNs5hMMvSItOpEhBkg-2FJ0kYEQl5BH7URUVHCsSVOWjkNvi6zR-2FCee4d8N9rdlB-2B-2BNQmKTCmAUkpaN1rUCo-2FmHpxPBegoAXAq7xhUhVsrwB5ZMiE016PcvZVtmPOpQ6JUgEsOPmlwgqpiBBdS72F0MBAaHJ4UlwO0M08c-3D3scO_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nw5KA5beJqibyCtKjs9B8ujlcJz2XyMv0igaenerEPZCi-2BBaSRMwy51CLX95xCACWKNyJ0D4Uw5yeEIBGgS1xQt-2FDDxs9on7jJAO1iusiJLC-2FIwban22f-2FXbBPIc9TY9KlGymfoYNWMw-2BbFxypix9BZb8hDCEIqaFfjNphExgkdPw-3D-3D'
          )
          .reply(301, undefined, {
            Location:
              'https://timesofindia.indiatimes.com/india/timestopten/msid-97559156.cms?utm_source=newsletter&utm_medium=email&utm_campaign=timestop10_daily_newsletter',
          })
        nock('https://timesofindia.indiatimes.com')
          .head(
            '/india/timestopten/msid-97559156.cms?utm_source=newsletter&utm_medium=email&utm_campaign=timestop10_daily_newsletter'
          )
          .reply(200, '')
      })

      it('returns url when email is from India Times', async () => {
        const url =
          'https://timesofindia.indiatimes.com/india/timestopten/msid-97559156.cms?utm_source=newsletter&utm_medium=email&utm_campaign=timestop10_daily_newsletter'
        const html = load('./test/data/india-times-newsletter.html')

        await expect(
          new IndiaTimesHandler().parseNewsletterUrl({}, html)
        ).to.eventually.equal(url)
      })
    })
  })

  describe('get author from email address', () => {
    it('returns author when email is from Substack', () => {
      const from = 'Jackson Harper from Omnivore App <jacksonh@substack.com>'
      expect(new AxiosHandler().parseAuthor(from)).to.equal(
        'Jackson Harper from Omnivore App'
      )
    })

    it('returns author when email is from Axios', () => {
      const from = 'Mike Allen <mike@axios.com>'
      expect(new AxiosHandler().parseAuthor(from)).to.equal('Mike Allen')
    })

    it('returns email address if author is not there', () => {
      const from = 'mike@axios.com'
      expect(new AxiosHandler().parseAuthor(from)).to.equal(from)
    })
  })

  describe('getNewsletterHandler', () => {
    it('returns substack newsletter handler', async () => {
      const html = load('./test/data/substack-forwarded-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(SubstackHandler)
    })

    it('returns SubstackHandler for private forwarded substack newsletter', async () => {
      const html = load(
        './test/data/substack-private-forwarded-newsletter.html'
      )
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(SubstackHandler)
    })

    it('returns undefined for substack welcome email', async () => {
      const html = load('./test/data/substack-forwarded-welcome-email.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.undefined
    })

    it('returns SubstackHandler for substack newsletter with static tweets', async () => {
      const html = load(
        './test/data/substack-with-static-tweets-newsletter.html'
      )
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(SubstackHandler)
    })

    it('fixes up static tweets in Substack newsletters', async () => {
      const url =
        'https://astralcodexten.substack.com/p/nick-cammarata-on-jhana'
      const html = load(
        './test/data/substack-with-static-tweets-newsletter.html'
      )
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(SubstackHandler)

      const dom = parseHTML(html).document
      expect(handler?.shouldPreParse(url, dom)).to.be.true

      const preparsed = await handler?.preParse(url, dom)
      const tweets = Array.from(
        preparsed?.querySelectorAll('div[class="_omnivore-static-tweet"]') ?? []
      )

      expect(tweets.length).to.eq(7)
    })

    it('fixes up static quote tweets in Substack newsletters', async () => {
      const url =
        'https://www.lennysnewsletter.com/p/how-to-use-chatgpt-in-your-pm-work'
      const html = load('./test/data/substack-static-quote-tweet.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(SubstackHandler)

      const dom = parseHTML(html).document
      expect(handler?.shouldPreParse(url, dom)).to.be.true

      const preparsed = await handler?.preParse(url, dom)
      const tweets = Array.from(
        preparsed?.querySelectorAll(
          'div[class="_omnivore-static-quote-tweet"]'
        ) ?? []
      )

      expect(tweets.length).to.eq(1)
    })

    it('returns BeehiivHandler for beehiiv.com newsletter', async () => {
      const handler = await getNewsletterHandler({
        html: '',
        from: '',
        headers: {
          'x-newsletter': 'https://www.milkroad.com/p/bored-ape-amazon',
          'x-beehiiv-type': 'newsletter',
        },
      })
      expect(handler).to.be.instanceOf(BeehiivHandler)
    })

    it('returns GhostHandler for ghost newsletter', async () => {
      const html = load('./test/data/ghost-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(GhostHandler)
    })

    it('returns ConvertkitHandler for convertkit newsletter', async () => {
      const html = load('./test/data/convertkit-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(ConvertkitHandler)
    })

    it('returns CooperPressHandler for node-weekly newsletter', async () => {
      const html = load('./test/data/node-weekly-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(CooperPressHandler)
    })

    it('returns HeyWorldHandler for hey world newsletter', async () => {
      const html = load('./test/data/hey-world-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: 'Hongbo Wu <hw@world.hey.com>',
        headers: {
          'list-unsubscribe':
            '<https://world.hey.com/dhh/subscribers/MtuoW9TvSJK9o5c7ohB72V2s/unsubscribe>',
        },
      })
      expect(handler).to.be.instanceOf(HeyWorldHandler)
    })

    it('returns ConvertkitHandler for Tomasz Tunguz newsletter', async () => {
      const html = load('./test/data/tomasz-tunguz-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.instanceOf(ConvertkitHandler)
    })

    it('returns undefined for convertkit confirmation email', async () => {
      const html = load('./test/data/convertkit-confirmation.html')
      const handler = await getNewsletterHandler({
        html,
        from: '',
        headers: {},
      })
      expect(handler).to.be.undefined
    })

    it('returns GenericHandler for TTSO newsletter', async () => {
      const html = load('./test/data/ttso-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: 'Time To Sign Off <daily@timetosignoff.fr>',
        headers: {
          'list-id': '<daily.timetosignoff.fr.k5yx-uok.mj>',
          'list-unsubscribe':
            '<mailto:unsub-e86467ca.k5yx.x15515@bnc3.mailjet.com>, <https://k5yx.mjt.lu/unsub2?m=AAAAADHYIIAActfCvIAALdDY50AAAAAtZ4AAC8UAAk9yQBj2U4KUkToWXqgR9OqHSm_LHvyrQAIwzU&b=e86467ca&e=7132d286&x=FUkLKVFH4r_0f--3tAm2RPnjzf5a0IVmKjTWv1nE-GAaJXzXvZHIKiojmrtWYhDE>',
        },
      })
      expect(handler).to.be.instanceOf(GenericHandler)
    })

    it('returns EveryIoHandler for every.io newsletter', async () => {
      const html = load('./test/data/every-io-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: 'Every <hello@every.to>',
        headers: {},
      })
      expect(handler).to.be.instanceOf(EveryIoHandler)
    })

    it('returns EnergyWorldHandler for energy world newsletter', async () => {
      const html = load('./test/data/energy-world-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: 'ETEnergyworld Latest News<newsletter@etenergyworld.com>',
        headers: {},
      })
      expect(handler).to.be.instanceOf(EnergyWorldHandler)
    })

    it('returns IndiaTimesHandler for india times newsletter', async () => {
      const html = load('./test/data/india-times-newsletter.html')
      const handler = await getNewsletterHandler({
        html,
        from: 'The Times of India  <newsletters@timesofindia.com>',
        headers: {},
      })
      expect(handler).to.be.instanceOf(IndiaTimesHandler)
    })
  })

  describe('findNewsletterUrl', async () => {
    context('when email is from Substack', () => {
      before(() => {
        nock('https://email.mg2.substack.com')
          .head(
            '/c/eJxNkk2TojAQhn-N3KTyQfg4cGDGchdnYcsZx9K5UCE0EMVAkTiKv36iHnarupNUd7rfVJ4W3EDTj1M89No496Uw0wCxgovuwBgYnbOGsZBVjDHzKPWYU8VehUMWOlIX9Qhw4rKLzXgGZziXnRTcyF7dK0iIGMVOG_OS1aTmKPRDilgVhTQUPCQIcE0x-MFTmJ8rCUpA3KtuenR2urg1ZtAzmszI0tq_Z7m66y-ilQo0uAqMTQ7WRX8auJKg56blZg7WB-iHDuYEBzO6NP0R1IwuYFphQbbTjnTH9NBfs80nym4Zyj8uUvyKbtUyGr5eUz9fNDQ7JCxfJDo9dW1lY9lmj_JNivPbGmf2Pt_lN9tDit9b-WeTetni85Z9pDpVOd7L1E_Vy7egayNO23ZP34eSeLJeux1b0rer_xaZ7ykS78nuSjMY-nL98rparNZNcv07JCjN06_EkTFBxBqOUMACErnELUNMSxTUjLDQZwzcqa4bRjCfeejUEFefS224OLr2S5wxPtij7lVrs80d2CNseRV2P52VNFMBipcdVE-U5jkRD7hFAwpGOylVwU2Mfc9qBh7DoR89yVnWXhgQFHnIsbpVb6tU_B-hH_2yzWY'
          )
          .reply(301, undefined, {
            Location:
              'https://newsletter.slowchinese.net/p/companies-that-eat-people-217',
          })
        nock('https://newsletter.slowchinese.net')
          .head('/p/companies-that-eat-people-217')
          .reply(200, '')
      })

      it('gets the URL from the header', async () => {
        const html = load('./test/data/substack-forwarded-newsletter.html')
        const url = await new SubstackHandler().findNewsletterUrl(html)
        // Not sure if the redirects from substack expire, this test could eventually fail
        expect(url).to.startWith(
          'https://newsletter.slowchinese.net/p/companies-that-eat-people-217'
        )
      })
    })

    context('when email is from beehiiv', () => {
      it('gets the URL from the header', async () => {
        const url = await new BeehiivHandler().parseNewsletterUrl(
          {
            'x-newsletter': 'https://www.milkroad.com/p/bored-ape-amazon',
          },
          ''
        )
        expect(url).to.startWith('https://www.milkroad.com/p/bored-ape-amazon')
      })
    })

    context('when email is from convertkit', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=MnmHBiCwIPe9TmIJeskmA7wDTJvdVU1ACmSJ753YuhScf71JWthxqM8RnVh-2FZG0rYzrbR04P99S2ld2OkTtQmrx2FDwArpYdk5N0jVpN9dLBZ-2BdPNqkRHxNvuygY8-2F-2FtRNFoPjxjtTuyWM6L3tcYDYnAnL2xCueddWcFlUNrQWsvLotmgvC-2BrQc7bxsZhW0pUBmS_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nzSBnnaDN-2FNHWDodWnbUOPZ063v3w3z8QtcaPpE1qNu8xYkNJJFb-2F1uZEG-2BzsLfyDkjvvVX5zYs5OyyRYlhMOlXDJcr4-2FtMrFwii0uFAvwbhxDdnTxEpi-2F7maufyH39AEO-2BtCeSUg5V4FM43UpI1zUSXeWK-2Fh5JumSmR5XhrrRAig-3D-3D'
          )
          .reply(301, undefined, {
            Location: 'https://fs.blog/brain-food/october-16-2022/',
          })
        nock('https://fs.blog')
          .head('/brain-food/october-16-2022/')
          .reply(200, '')
      })

      it('gets the URL from the header', async () => {
        const html = load('./test/data/convertkit-newsletter.html')
        const url = await new ConvertkitHandler().findNewsletterUrl(html)
        expect(url).to.startWith('https://fs.blog/brain-food/october-16-2022/')
      })
    })

    it('returns undefined if it is not a newsletter', async () => {
      const html = load('./test/data/substack-forwarded-welcome-email.html')
      const url = await new SubstackHandler().findNewsletterUrl(html)
      expect(url).to.be.undefined
    })

    context('when email is from ghost', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=MnmHBiCwIPe9TmIJeskmA9nRLefEmmgrd5xWS-2Bc39wxPBpwDRny1FmWt1H0FpgKAz1dv_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nzulL-2F3YyC-2FHgJV0JnOPtjNvgjHSaQVfisQ15hPQtnlo4t73zgTQL4QnDoer4qJ3-2F2Lf-2F2ElFMF3NyoUD4eqWCWwUM0w4P9Feaeo-2BolkySAB611BySXRt6V3Z-2F7mQcpcRX3D9zV-2B-2FdRY0Vn30aR-2BKY8qpTFuivxzF19UkQGjK5srg-3D-3D'
          )
          .reply(301, undefined, {
            Location: 'https://www.openml.fyi/2022-10-14/',
          })
        nock('https://www.openml.fyi').head('/2022-10-14/').reply(200, '')
      })

      it('gets the URL from the header', async () => {
        const html = load('./test/data/ghost-newsletter.html')
        const url = await new GhostHandler().findNewsletterUrl(html)
        expect(url).to.startWith('https://www.openml.fyi/2022-10-14/')
      })
    })

    context('when email is from cooper press', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=MnmHBiCwIPe9TmIJeskmA7mFdqmsIs-2B5Xs-2FNpSIs56obSPDXnoBEjufvIqRCEJUf5Uqg_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nyFE700vlj1-2FK27spZiPEiEkDU3SIXWGeoiU60KFhM-2B-2Bxx5yiL8KKbAV6oFceRi8O1gMc3mdwg5D8FaaM3PublaX24iAcVbn99PzxJaPuVrU6xDWbRovw2UgGTIoEI-2BBO-2B0qzi2wv5c6yJTkUGZOcsJ6xGLXO1BO-2BHSbyZMZV4NMw-3D-3D'
          )
          .reply(301, undefined, {
            Location: 'https://nodeweekly.com/issues/459',
          })
        nock('https://nodeweekly.com').head('/issues/459').reply(200, '')
      })

      it('gets the URL from the header', async () => {
        const html = load('./test/data/node-weekly-newsletter.html')
        const url = await new CooperPressHandler().findNewsletterUrl(html)
        expect(url).to.startWith('https://nodeweekly.com/issues/459')
      })
    })

    context('when email is from hey world', () => {
      before(() => {
        nock('https://world.hey.com')
          .head('/dhh/here-s-how-to-fix-twitter-79632ecb')
          .reply(200, '')
      })

      it('gets the URL from the header', async () => {
        const html = load('./test/data/hey-world-newsletter.html')
        const url = await new HeyWorldHandler().findNewsletterUrl(html)
        expect(url).to.startWith(
          'https://world.hey.com/dhh/here-s-how-to-fix-twitter-79632ecb'
        )
      })
    })

    context('when email is from TTSO', () => {
      before(() => {
        nock('https://u25184427.ct.sendgrid.net')
          .head(
            '/ls/click?upn=P3-2FaBQ7M-2FNDUahrImPzjb5IJ1HxwpoWueibAnkVYsE7-2BEheb6ET732gFDDPaU3kbVi8SbYJ1qrmirIU-2Bv-2FXI7ATVIKLxbniavLprvKAI4D4MF3x-2BTrsmTPADymnqAAcraWiuQsupuWZBun933pm6WZqKUKSxVYJzstKQf99AKNWeVPVRJp6JB2iY2FYSMsK-2BuUvZxdKXxO6ulSVynglWjqVN-2BoymZZUGgPSZyaxhVOPaGh3Zm8XAjQ-2Bg-2Bj5lJv2d7V5T_vVXscVLXlj5UtQe3aqo5RMTdTq2PepdZjP86UOmA8nxwv9liJXSvQhGKaieq5BGLFF1BYI-2FiEnfr1neeqi6jXSQvOWKGt9lxEPSLVP3ON5ZlNo-2FabdBl0c-2BV7Fivi1b3NGRcnoPsSyWZVXcYqCHaabltMz0-2Bw3U3rmfSIGPyDyyRcrmT81QUw6CrIx55zcwJlPbX7eL0Y2Gp9y7AymwAgw-3D-3D'
          )
          .reply(301, undefined, {
            Location: 'https://ttso.paris/2023-01-31',
          })
        nock('https://ttso.paris').head('/2023-01-31').reply(200, '')
      })

      it('gets the URL from the header', async () => {
        const html = load('./test/data/ttso-newsletter.html')
        const url = await new GenericHandler().findNewsletterUrl(html)
        expect(url).to.startWith('https://ttso.paris/2023-01-31')
      })
    })
  })

  describe('generateUniqueUrl', () => {
    it('generates a unique URL', () => {
      const url1 = generateUniqueUrl()
      const url2 = generateUniqueUrl()

      expect(url1).to.not.eql(url2)
    })
  })

  describe('get unsubscribe from header', () => {
    const mailTo = 'unsub@omnivore.com'
    const httpUrl = 'https://omnivore.com/unsubscribe'

    it('returns mail to address if exists', () => {
      const header = `<https://omnivore.com/unsub>, <mailto:${mailTo}>`

      expect(new GenericHandler().parseUnsubscribe(header).mailTo).to.equal(
        mailTo
      )
    })

    it('returns http url if exists', () => {
      const header = `<${httpUrl}>`

      expect(new GenericHandler().parseUnsubscribe(header).httpUrl).to.equal(
        httpUrl
      )
    })
  })

  describe('preParse', () => {
    context('when email is from Substack', () => {
      it('removes the Substack footer and header', async () => {
        const url = 'https://blog.omnivore.app/p/omnivore-2021-01-31'
        const html = load('./test/data/substack-newsletter-new.html')
        const dom = parseHTML(html).document
        const preparedDom = await new SubstackHandler().preParse(url, dom)
        // compare prepared html to the expected html
        const expectedHTML = load(
          './test/data/prepared/substack-newsletter-new.html'
        )
        expect(preparedDom.documentElement.outerHTML).to.eql(expectedHTML)
      })
    })
  })
})
