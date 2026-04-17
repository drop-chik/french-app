import type { ContentBlock } from '../../../features/grammar/api';
import styles from './ContentRenderer.module.css';

interface Props {
  blocks: ContentBlock[];
}

export function ContentRenderer({ blocks }: Props) {
  return (
    <div className={styles.content}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <div key={i} className={styles.block}>
                {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
                <p className={styles.paragraph}>{block.text}</p>
              </div>
            );

          case 'table':
            return (
              <div key={i} className={styles.block}>
                {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    {block.headers && (
                      <thead>
                        <tr>
                          {block.headers.map((h, j) => (
                            <th key={j} className={styles.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {block.rows?.map((row, j) => (
                        <tr key={j} className={styles.tr}>
                          {row.map((cell, k) => (
                            <td key={k} className={styles.td}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );

          case 'example_list':
            return (
              <div key={i} className={styles.block}>
                {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
                <ul className={styles.exampleList}>
                  {block.items?.map((item, j) => (
                    <li key={j} className={styles.exampleItem}>
                      <span className={styles.exampleFr}>{item.fr}</span>
                      <span className={styles.exampleRu}>{item.ru}</span>
                      {item.note && <span className={styles.exampleNote}>{item.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            );

          case 'rule_list':
            return (
              <div key={i} className={styles.block}>
                {block.title && <h3 className={styles.blockTitle}>{block.title}</h3>}
                <ul className={styles.ruleList}>
                  {block.rules?.map((rule, j) => (
                    <li key={j} className={styles.ruleItem}>{rule}</li>
                  ))}
                </ul>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
