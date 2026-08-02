import stylelint from 'stylelint';

const { createPlugin, utils } = stylelint;
const { report, ruleMessages, validateOptions } = utils;

const ruleName = 'portfolio/no-unlayered-globals';

const messages = ruleMessages(ruleName, {
  rejected: (selector) =>
    `Selector "${selector}" is not nested inside an @layer block. ` +
    `Unlayered CSS always beats layered CSS (e.g. Tailwind utilities) ` +
    `regardless of specificity - see reference/TAILWIND_MIGRATION_PLAN.md ` +
    `for the bug class this guards against. Wrap this rule in @layer base ` +
    `(or the appropriate layer).`,
});

const meta = {
  url: 'https://github.com/EllieAtWHL/my-portfolio-website',
};

function hasLayerAncestor(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && parent.name === 'layer') return true;
  }
  return false;
}

function hasKeyframesAncestor(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === 'atrule' && /^(-\w+-)?keyframes$/i.test(parent.name)) return true;
  }
  return false;
}

const rule = (primary) => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, {
      actual: primary,
      possible: [true, false],
    });

    if (!validOptions || !primary) return;

    root.walkRules((ruleNode) => {
      // Keyframe step selectors (from/to/0%/100%) don't participate in
      // cascade-layer ordering the same way real style rules do.
      if (hasKeyframesAncestor(ruleNode)) return;

      if (!hasLayerAncestor(ruleNode)) {
        report({
          message: messages.rejected(ruleNode.selector),
          node: ruleNode,
          result,
          ruleName,
        });
      }
    });
  };
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default createPlugin(ruleName, rule);
