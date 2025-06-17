import { type NextPage } from 'next'
import Head from 'next/head'
import { Button } from '@multiverse/ui'

const HomePage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Multiverse Finance</title>
        <meta name="description" content="Event-Conditional UBI Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Multiverse Finance
        </h1>
        <p className="text-center text-lg text-muted-foreground mb-8">
          Event-Conditional Universal Basic Income Platform
        </p>
        <div className="flex justify-center">
          <Button>Get Started</Button>
        </div>
      </main>
    </>
  )
}

export default HomePage 