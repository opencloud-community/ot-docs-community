import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Community-maintained deployment and operation documentation for OpenTalk">
      <HomepageHeader />
      <main>
        <div className="container margin-vert--lg">
          <div className="row">
            <div className="col col--6">
              <div className="card shadow--md margin--md padding--md">
                <h2>Deployment Documentation</h2>
                <p>
                  Step-by-step guides for deploying OpenTalk with Docker Compose,
                  covering various scenarios from development to production.
                </p>
                <div className="card__footer">
                  <Link
                    className="button button--primary"
                    to="/docs/category/deployment">
                    View Deployment Guides
                  </Link>
                </div>
              </div>
            </div>
            <div className="col col--6">
              <div className="card shadow--md margin--md padding--md">
                <h2>Operation Guides</h2>
                <p>
                  Guidance on maintaining and troubleshooting your OpenTalk instance,
                  including backup procedures and performance optimization.
                </p>
                <div className="card__footer">
                  <Link
                    className="button button--primary"
                    to="/docs/category/operation">
                    View Operation Guides
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}