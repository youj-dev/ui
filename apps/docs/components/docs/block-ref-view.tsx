import { BuiltWith } from '@/components/showcase/built-with'
import type { BlockRefData, RefCode, RefProps } from '@/lib/block-ref'
import { CodeFigure } from './code-figure'
import { InstallTabsView } from './install-tabs-view'
import { PropsTableView } from './props-table-view'
import { ReferenceRow } from './reference'

/* A block page's Get started and Reference for the story on show, drawn from
 * its data (lib/block-ref.ts): the first story's comes with the page, the
 * others' are fetched when picked (./block-stories-view). */

function Code({ code }: { code: RefCode }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: html is highlighted from repo source at build time
  return <CodeFigure title={code.title} className={code.className} tabIndex={0} dangerouslySetInnerHTML={{ __html: code.html }} />
}

/** An item's props and the shapes its data takes, as tables under headings. */
function PropsOf({ props }: { props: RefProps }) {
  return (
    <>
      {props.component && <PropsTableView name={props.component.name} doc={props.component} />}
      {props.types.map((type) => (
        <div key={type.name}>
          <h3 id={`type-${type.name.toLowerCase()}`}>
            <code>{type.name}</code>
          </h3>
          <PropsTableView name={type.name} doc={type} />
        </div>
      ))}
    </>
  )
}

/** `Install`, what the CLI writes, and the usage snippet that feeds the block your own data. */
export function BlockUsageView({ data }: { data: BlockRefData }) {
  const { install, note, usage } = data
  return (
    <>
      {'stack' in install ? <Code code={install.stack} /> : <InstallTabsView {...install.tabs} />}
      <p>
        {'stack' in note ? (
          <>It’s {note.stack} blocks stacked into one page, so it installs as those blocks, each with the components it uses.</>
        ) : (
          <>
            The CLI copies the block to <code>{note.file}</code> with every component it uses, so it’s yours to edit.
          </>
        )}
      </p>
      {usage &&
        ('demo' in usage ? (
          <p>Demo content: this block doesn’t take data yet, so edit its file after adding it.</p>
        ) : usage.frame ? (
          <div>
            <p>
              It lives in the app frame (<code>AppFrame</code>, installed with it), which holds your pages, the one you’re on and your router’s links, so every part of
              the frame reads them from one place. Put the frame in your app’s layout, give it your nav, and the sidebar draws it:
            </p>
            <Code code={usage.code} />
          </div>
        ) : (
          <div>
            <p>
              Every prop is optional and falls back to the demo, so it renders as you see it until you pass your own. Give it your data, rewrite or translate its
              strings through <code>copy</code>, and connect its actions:
            </p>
            <Code code={usage.code} />
          </div>
        ))}
    </>
  )
}

/** A block's Props, Strings and what it's built from, as the rows of a Reference. */
export function BlockReferenceView({ data }: { data: BlockRefData }) {
  const { props, strings, builtFrom } = data
  return (
    <>
      {props && (
        <ReferenceRow title="Props" summary={props.summary}>
          <h3>Props</h3>
          <div>
            <PropsOf props={props.own} />
            {props.frame && (
              <>
                <h3 id="the-frame">
                  The frame: <code>AppFrame</code>
                </h3>
                <PropsOf props={props.frame} />
              </>
            )}
          </div>
        </ReferenceRow>
      )}
      {strings && (
        <ReferenceRow title="Strings" summary={strings.summary}>
          <h3>Strings</h3>
          <div>
            <p>
              <code>copy</code> takes any of these keys; the rest keep their defaults. A key whose text holds a value (a count, a name) takes a function.
            </p>
            {/* The chip's class is on the list, once, not on each of its (dozens of) keys. */}
            <div className="not-prose flex flex-wrap gap-1 [&>code]:value-chip">
              {strings.keys.map((key) => (
                <code key={key}>{key}</code>
              ))}
            </div>
          </div>
        </ReferenceRow>
      )}
      {builtFrom && (
        <ReferenceRow title="Built from" summary={builtFrom.summary}>
          <h3>Built from</h3>
          <div className="not-prose flex flex-col gap-8">
            <BuiltWith label="Components used" links={builtFrom.components} />
            <BuiltWith label={builtFrom.stacked ? 'Blocks stacked' : 'Built on'} links={builtFrom.builtOn} />
          </div>
        </ReferenceRow>
      )}
      {data.demo && <p>Demo content: this block takes no props yet, so edit its file after adding it.</p>}
    </>
  )
}
