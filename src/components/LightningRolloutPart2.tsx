'use client';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';

export default function LightningRolloutPart2() {
  return (
    <div className="blog-article">
      <article className="blog-content">
        <h1 className="blog-main-title">Running the Migration Project</h1>
        
        <div className="blog-hero-image">
          <img 
            src="/lightning-rollout/lightning.jpeg" 
            alt="Lightning Strike"
            className="hero-image"
          />
        </div>
        
        <div className="blog-meta">
          <p><em>Originally posted on <a href="https://medium.com/@eleanormatthewman/salesforce-lightning-rollout-4db412e6682f" target="_blank" rel="noopener noreferrer">Medium</a> in May 2020</em></p>
        </div>

        <Card variant="highlight" padding="lg">
          <p>This is the second in my series to help you manage the completion of your Lighting roll-out successfully. I am currently working on my third roll-out of Lightning and so am sharing some of my learnings to help ensure yours goes smoothly. Everything I speak about below are things that have worked for me, however, that doesn't mean it is the only way to do it. As with most things Salesforce, there are multiple ways of doing things, these are the way I found to be successful.</p>
        </Card>
        
        <section className="blog-section">
          <h2 className="section-title">Roll Out Phase</h2>
          
          <h3 className="subsection-title">How do I manage the project of migrating over to Lightning?</h3>
          <p>To start your project, you will need to determine to things, your rollout strategy and the scope of work covered by it.</p>

          <Card variant="accent" padding="lg" className="topic-block">
            <h4 className="topic-title">Rollout Strategy</h4>
            <p>There are a variety of rollout strategies that can be used and what you decide upon will depend on the size and complexity of your Salesforce instance. The main two strategies are to roll out in groups of users (for example, either one team at a time, or one person from within each team) or a big bang approach of rolling it out to all users at once. I would highly recommend not considering the latter. My main reasoning is that even if you have managed to do as much research as possible into how the different areas of the business use Salesforce, there's almost always something somewhere that has been overlooked and the reputational risk of Lightning when this is discovered could lead to poor user adoption. If you move over teams at a time, you can ensure that it is working perfectly for one team before moving onto the next — and you can also learn from each iteration. The later teams should be quicker to roll out, as a lot of the changes will already have been made.</p>
          </Card>
          
          <Card variant="accent" padding="lg" className="topic-block">
            <h4 className="topic-title">Scope of Rollout</h4>
            <p>When considering the scope of work for the project, the primary objective might be to ensure that all existing functionality remains available in Lightning. However, it may be from your research that you have identified inefficient processes, so it may be decided to make improvements to those as part of the rollout. Whatever the decisions are made, you need to ensure the business is clear what the scope is to avoid disappointment and potentially damaging the reputation of Lightning.</p>

            <p>The video below goes into a bit more detail about planning your rollout.</p>
            
            <div className="video-container">
              <iframe 
                src="https://www.youtube.com/embed/LB36V95IEJQ" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="video-iframe"
              ></iframe>
            </div>
            
            <p>Once these are agreed, your work is split into two categories: Change Management and Technical Implementation. Depending on the size of your company you may need to manage both aspects of these yourself, so make sure you plan carefully.</p>
          </Card>
        </section>

        <section className="blog-section">
          <h2 className="section-title">Change Management</h2>

          <p>However large or small your company is, you are going to have to manage the rollout of Lightning carefully to try and capture maximum user adoption possible, below are some suggestions on how to manage the change.</p>

          <Card variant="accent" padding="lg" className="topic-block">
            <h4 className="topic-title">Lightning Champions</h4>
            <p>If your company is particularly large, you may want to consider running a formal Lightning Champion programme. These volunteers will be your early adopters and become cheerleaders for you. They will also be able to provide crucial feedback in the early stages to ensure that Lightning is set up in a way that is optimal for each team. In a more formal programme, you may want to consider incentives for your Champions, such as prizes or rewards.</p>

            <p>In smaller companies, you may not run a formal Lightning Champions programme, however, you should still consider teams or users who have proven helpful in the past or who show a particular enthusiasm for Lighting, to become your early adopters and migrate them first.</p>
          </Card>

          <Card variant="accent" padding="md" className="topic-block">
            <h4 className="topic-title">Feedback</h4>
            <p>Now that you have a group of early adopters, make sure that you have a mechanism for them providing feedback to you about the use of Lightning. There are some solutions already built into Salesforce — such as the <a href="https://help.salesforce.com/articleView?id=lex_encourage_work_feedback.htm" target="_blank" rel="noopener noreferrer">Switch to Classic Feedback Form</a> or using a Chatter group. You could come up with some other tools too, such as a Google Form they can complete anonymously or even an Excel sheet to complete. How you collect the feedback is your choice, but make sure it is a way that is simplest for the user — remember they are helping you — whilst also being easy to track at your end.</p>
          </Card>

          <Card variant="accent" padding="md" className="topic-block">
            <h4 className="topic-title">Marketing</h4>
            <p>You'll need to market the change appropriately to gain as much buy-in with your end-users, increasing user adoption post rollout. If your company has a Marketing team, consider enlisting them to assist with this. Either way, Salesforce provides some email templates you could use as part of a drip campaign. They can be found as part of the <a href="https://help.salesforce.com/articleView?id=lex_enablement_pack.htm" target="_blank" rel="noopener noreferrer">Lightning Experience Enablement Pack</a>. Consider other ways you can market it to — office posters in the break room, an article on the company Intranet.</p>

            <p>Understanding the <a href="https://www.ballantine.com/understanding-the-marketing-rule-of-7/" target="_blank" rel="noopener noreferrer">Marketing Rule of 7</a> can help you understand different avenues you can use to help get engagement and buy-in. Although you are not selling anything externally for money, and therefore some of the suggestion may not be appropriate, it should give you some ideas for how to move things forward internally to sell the idea of Lightning.</p>
          </Card>

          <Card variant="accent" padding="md" className="topic-block">
            <h4 className="topic-title">Training</h4>
            <p>Training will need to be provided to the majority of the end-users, and decisions will need to be made around who will deliver this. In a large company, you could consider a train the trainer with your Lightning Champions for them to train the rest of their areas. In smaller companies, you may be left to train them yourself.</p>

            <p>Salesforce has provided a template PowerPoint presentation in their <a href="https://help.salesforce.com/s/articleView?id=sf.lex_enablement_pack.htm&type=5" target="_blank" rel="noopener noreferrer">Enablement Pack</a>, but ensure that you only use this as a guide for your presentation, which should follow your company's branding guidelines and only contain relevant information. Include screenshots from your own Salesforce instance where you can, and plan for live demos, but include videos in the presentation in case anything goes wrong with the demo, such issues connecting to the internet.</p>

            <p>Trailhead also offers a wide range of free resources to help train a full spectrum of Salesforce users across a breadth of topics. Consider your different areas you are rolling out to and which trails might be most relevant to them and then guide your users to them. I can recommend this generic one to get started with — <a href="https://trailhead.salesforce.com/en/content/learn/trails/lex_user_learn_fundamentals" target="_blank" rel="noopener noreferrer">Learn to Work in Lightning Experience</a>.</p>
          </Card>

          <Card variant="accent" padding="md" className="topic-block">
            <h4 className="topic-title">FAQs</h4>
            <p>There will be some frequently asked questions from your end-users. You can try to pre-empt them with a prepared FAQ sheet, and add to it as the implementation continues. Here are some examples that I have come across.</p>
            
            <div>
              <Card variant="default" padding="md" className="subtopic">
                <h5 className="subtopic-title">Do I need to enter all my data again/If I update it in Lighting, will it update in Classic?</h5>
                <p>All the data that sits behind the scenes remains the same and there is only one copy of the data. All your data is already available in Lightning, just as it was in Classic, and any update you do in either interface will reflect in the other.</p>
              </Card>

              <Card variant="default" padding="md" className="subtopic">
                <h5 className="subtopic-title">Why is my List View empty?</h5>
                <div className="blog-image">
                  <img 
                    src="/lightning-rollout/empty-list-view.png" 
                    alt="Empty List View"
                    className="content-image"
                  />
                </div>
                <p>When you go to an object tab — such as Opportunities — for the first time in Lightning, it will default to your "Recently Viewed" list view, but it will be empty. This doesn't mean all of your Opportunities have gone, it simply means that you haven't viewed any Opportunities in Lightning yet. As you use Lightning, your recently viewed opportunities will show here, or you can access other List Views from the drop-down available — even pinning them so they become the default view on the tab home.</p>
              </Card>

              <Card variant="default" padding="md" className="subtopic">
                <h5 className="subtopic-title">Where are all my reports?</h5>
                <div className="blog-image">
                  <img 
                    src="/lightning-rollout/no-reports.png" 
                    alt="No Reports"
                    className="content-image"
                  />
                </div>
                <p>When you go to the Reports tab, the default view is Recent. If this is your first time looking at your reports in Lightning, you won't have any reports showing. Even if you search using the search bar just above the list, your report will not appear as you have not viewed it. Be sure to change your view on the left-hand side to the appropriate view (probably All Reports or you can go to All Folders if you know where the report you are trying to find is). It is probably a good idea to use the new Favorite functionality with the reports you are going to want to access regularly.</p>
              </Card>
            </div>
          </Card>
        </section>

        <section className="blog-section">
          <h2 className="section-title">Technical Implementation</h2>
          <p>This is the technical tasks that need to be done to ensure that all of the existing functionality that is available in Classic, is readily available in Lightning. The good news is that there is most of the work is automatically done for you by Salesforce, and those that aren't, will be picked up in the Lightning Readiness Report that you ran as part of your Discovery phase.</p>
          
          <p>I can sit here and tell you exactly what you need to do, as every implementation is different, so the only way you are going to be able to do this is to study the Readiness Report and test, test, test!</p>
          
          <p>Some of the changes may be a simple point and click change, however, some may need code. You may find some functionality that is out of the box in Classic, isn't readily available in Lightning. In these instances, you will need to determine the time it would take to develop a replacement and compare it with how much the functionality is needed to determine if the functionality will remain available.</p>
          
          <p>A lot of how the technical tasks that need to be done are managed depends on the way the project is being done. You may have stories written in Jira or cases in Salesforce or just lines on an Excel spreadsheet — however you decide to do it, you should make sure that each task required is documented and status updated.</p>
          
          <div>
            <Card variant="accent" padding="md"  className="topic-block">
              <h5 className="subtopic-title">Lightning Experience Configuration Converter</h5>
              <p>Salesforce continues to provide tools to help you migrate some of the functionality that doesn't convert into Lightning to work in Lightning. As of the time of writing, using the <a href="https://lightning-configuration.salesforce.com/home.xhtml" target="_blank" rel="noopener noreferrer">Lightning Experience Configuration Converter tool</a>, you can get assistance in migrating:</p>
              
              <ul>
                <li><strong>JavaScript Buttons</strong> - Custom JavaScript buttons used in Classic may not work in Lightning due to different JavaScript handling</li>
                <li><strong>Actions & Buttons</strong> - Custom actions and buttons that need Lightning-compatible alternatives</li>
                <li><strong>Visualforce Pages</strong> - Custom Visualforce pages that may need updates for Lightning compatibility</li>
                <li><strong>Hard-Coded URLs</strong> - Static URLs that may need updating to Lightning paths</li>
                <li><strong>App Exchange Packages</strong> - Third-party packages that may need Lightning versions</li>
              </ul>
              
              <p>You can link the tool to your sandbox first, to test and try out the changes in a safe environment first and deploy to Production in your usual manner.</p>
            </Card>

            <Card variant="accent" padding="md" className="topic-block">
              <h5 className="subtopic-title">Visualforce Pages</h5>
              <p>Custom Visualforce pages that were built for Classic may need to be rebuilt or updated for Lightning. Lightning uses a different UI framework, so some Visualforce components may not render correctly. You should test all your custom pages thoroughly and consider using Lightning Web Components (Aura or LWC) as replacements where appropriate.</p>
              
              <p>If your Visualforce pages are simple without any JavaScript, then it may be as simple as adding a <code>lightningStylesheets="true"</code> tag to your page:</p>
              
              <pre><code>&lt;apex:page lightningStylesheets="true"&gt;</code></pre>
              
              <Card variant="default" padding="md" className="subtopic">
                <p>Note: that you can use the Configuration Converter to add this tag without having to go into code and update it. One of the advantages of this tag is that is the user is in Classic, it will render to look like Classic, as usual, however, if the user is in Lightning Experience, the page will render to mimic the Lightning look and feel.</p>
              </Card>
              
              <p>Do be aware that there are circumstances where this tag will not work. You may also find other issues in your Visualforce pages, especially where JavaScript is used. The Configuration Converter will identify these issues for you and offer potential solutions. Make sure you test each page in Classic and Lightning to confirm full functionality.</p>
              
              <p>Watch the below video for more information on how to make your Visualforce pages Lightning ready.</p>
              
              <div className="video-container">
                <iframe 
                  src="https://www.youtube.com/embed/TVGm-XttiAM" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="video-iframe"
                ></iframe>
              </div>
            </Card>

            <Card variant="accent" padding="md"  className="topic-block">
              <h5 className="subtopic-title">JavaScript Buttons</h5>
              <p>Salesforce has prevented JavaScript buttons from displaying in Lightning. This is due to the security risk they can pose — you can read more about it in this <a href="https://trailhead.salesforce.com/content/learn/modules/lex_javascript_button_migration/lex_javascript_button_migration_intro" target="_blank" rel="noopener noreferrer">Trailhead module</a>. Therefore any existing JavaScript buttons you have will need to be converted into something that is more Lightning friendly. What functionality the button is achieving will drive what you need to build to replace it. As before, the Configuration Converter will not only identify any JavaScript buttons for you but also provide recommendations on the best solution for it. In some cases, it can even create the replacement for you, at the click of the button.</p>

              <p>For simpler buttons, you may be able to simply replace it with a Lightning Action, however, more complex buttons may require you to create a Lighting Web Component. This may be daunting if you have never done so before, but Salesforce — as always — have provided <a href="https://github.com/developerforce/LEXComponentsBundle" target="_blank" rel="noopener noreferrer">some templates</a> to give you a headstart.</p>

              <p>Watch the video below for more information on converting JavaScript buttons.</p>
              
              <div className="video-container">
                <iframe 
                  src="https://www.youtube.com/embed/vJqtFcOX17c" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="video-iframe"
                ></iframe>
              </div>
            </Card>
          </div>
        </section>

        <hr className="blog-divider" />

        <section className="blog-section">
          <p>Now that you have prepared both your users and the Salesforce instance to migrate to Lightning, you are now ready to launch it! But what do you do to keep the momentum going after it has been rolled out? I'll cover that in the last in the series.</p>
        </section>

        <div className="blog-navigation">
          <div className="nav-links">
            <Button variant="primary" asChild>
              <a href="/lightning-rollout/part-1">← Part 1</a>
            </Button>
            <Button variant="primary" asChild>
              <a href="/lightning-rollout/part-3">Part 3 →</a>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
}
