describe('demo: deliberately failing test', () => {
  it('proves the test job fails on a real assertion failure', () => {
    expect(1 + 1).toBe(3);
  });
});
